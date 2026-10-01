const router = require('express').Router();
const { v4: uuid } = require('uuid');

// GET /api/safety/clinic - List clinic records
router.get('/clinic', (req, res) => {
    try {
        const db = req.app.locals.db;
        const visits = db.prepare(`
            SELECT c.*, 
                   s.first_name, s.last_name, 
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as student_name,
                   s.grade, s.section, s.blood_group,
                   g.name as guardian_name, g.phone as guardian_phone
            FROM clinic_records c
            JOIN students s ON c.student_id = s.id
            LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = 1
            ORDER BY c.created_at DESC
        `).all();
        res.json(visits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/safety/clinic - Log new clinic checkup
router.post('/clinic', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { studentId, symptoms, treatment, temperature, pulse, administeredBy, parentNotified, status } = req.body;

        if (!studentId || !symptoms) {
            return res.status(400).json({ error: 'Student and symptoms are required' });
        }

        const id = 'CLI-' + uuid().slice(0, 8).toUpperCase();
        const today = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        db.prepare(`
            INSERT INTO clinic_records (id, student_id, visit_date, visit_time, symptoms, treatment, temperature, pulse, administered_by, parent_notified, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            studentId,
            today,
            timeStr,
            symptoms,
            treatment || 'Under Observation',
            temperature || '98.6°F',
            pulse || '76 bpm',
            administeredBy || 'Kavita Joshi (Nurse)',
            parentNotified ? 1 : 0,
            status || 'DISCHARGED'
        );

        res.json({ message: 'Clinic visit recorded successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/safety/library - List books & loans
router.get('/library', (req, res) => {
    try {
        const db = req.app.locals.db;
        const books = db.prepare(`
            SELECT b.*,
                   (SELECT COUNT(*) FROM library_loans WHERE book_id = b.id AND status IN ('ACTIVE','OVERDUE')) as loaned_count
            FROM library_books b
            ORDER BY b.title
        `).all();

        const activeLoans = db.prepare(`
            SELECT l.*, b.title, b.author,
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as student_name,
                   s.grade, s.section
            FROM library_loans l
            JOIN library_books b ON l.book_id = b.id
            JOIN students s ON l.student_id = s.id
            WHERE l.status IN ('ACTIVE','OVERDUE')
            ORDER BY l.due_date ASC
        `).all();

        res.json({ books, activeLoans });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/safety/library/loan - Issue book
router.post('/library/loan', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { bookId, studentId, dueDate } = req.body;
        if (!bookId || !studentId) {
            return res.status(400).json({ error: 'Book and student are required' });
        }

        const due = dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        db.prepare(`
            INSERT INTO library_loans (book_id, student_id, checkout_date, due_date, status)
            VALUES (?, ?, date('now'), ?, 'ACTIVE')
        `).run(bookId, studentId, due);

        db.prepare(`UPDATE library_books SET available_copies = MAX(0, available_copies - 1) WHERE id = ?`).run(bookId);

        res.json({ message: 'Book issued successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/safety/library/return - Return book
router.post('/library/return', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { loanId } = req.body;
        if (!loanId) return res.status(400).json({ error: 'Loan ID required' });

        const loan = db.prepare('SELECT * FROM library_loans WHERE id = ?').get(loanId);
        if (!loan) return res.status(404).json({ error: 'Loan not found' });

        db.prepare(`UPDATE library_loans SET status = 'RETURNED', return_date = date('now') WHERE id = ?`).run(loanId);
        db.prepare(`UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?`).run(loan.book_id);

        res.json({ message: 'Book returned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
