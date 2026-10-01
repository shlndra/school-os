const router = require('express').Router();
const { v4: uuid } = require('uuid');

// GET /api/notices - List all notices
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const notices = db.prepare(`SELECT * FROM circulars_notices ORDER BY is_urgent DESC, published_date DESC, created_at DESC`).all();
        res.json(notices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/notices - Create new circular
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { title, category, targetAudience, content, isUrgent, author } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const id = 'NOT-' + uuid().slice(0, 8).toUpperCase();
        const today = new Date().toISOString().split('T')[0];

        db.prepare(`
            INSERT INTO circulars_notices (id, title, category, target_audience, content, published_date, is_urgent, author)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            title,
            category || 'GENERAL',
            targetAudience || 'ALL',
            content,
            today,
            isUrgent ? 1 : 0,
            author || 'Principal Office'
        );

        res.json({ message: 'Circular broadcasted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/notices/student-progress/:studentId - Comprehensive parent view
router.get('/student-progress/:studentId', (req, res) => {
    try {
        const db = req.app.locals.db;
        const studentId = req.params.studentId;

        const student = db.prepare(`
            SELECT s.*, 
                   g.name as guardian_name, g.relation, g.phone as guardian_phone
            FROM students s
            LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = 1
            WHERE s.id = ?
        `).get(studentId);

        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Attendance stats
        const attStats = db.prepare(`
            SELECT status, count(*) as count 
            FROM student_attendance 
            WHERE student_id = ? 
            GROUP BY status
        `).all(studentId);

        let present = 0, absent = 0, late = 0;
        attStats.forEach(a => {
            if (a.status === 'PRESENT') present = a.count;
            if (a.status === 'ABSENT') absent = a.count;
            if (a.status === 'LATE') late = a.count;
        });
        const totalDays = present + absent + late;
        const attendancePct = totalDays > 0 ? Math.round((present / totalDays) * 100) : 96;

        // Pending fee invoices
        const invoices = db.prepare(`
            SELECT * FROM fee_invoices WHERE student_id = ? ORDER BY created_at DESC
        `).all(studentId);

        // Clinic visits
        const clinicVisits = db.prepare(`
            SELECT * FROM clinic_records WHERE student_id = ? ORDER BY visit_date DESC
        `).all(studentId);

        // Library loans
        const loans = db.prepare(`
            SELECT l.*, b.title, b.author 
            FROM library_loans l 
            JOIN library_books b ON l.book_id = b.id 
            WHERE l.student_id = ?
        `).all(studentId);

        // Bus transport stop
        const transport = db.prepare(`
            SELECT st.*, br.route_name, br.vehicle_number, bs.stop_name, bs.pickup_time
            FROM student_transport st
            JOIN bus_routes br ON st.route_id = br.id
            JOIN bus_stops bs ON st.stop_id = bs.id
            WHERE st.student_id = ?
        `).get(studentId);

        res.json({
            student,
            attendance: {
                present,
                absent,
                late,
                percentage: attendancePct
            },
            invoices,
            clinicVisits,
            loans,
            transport: transport || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
