const router = require('express').Router();
const { v4: uuid } = require('uuid');

// Seed sample initial leave requests if empty
function ensureSampleLeaves(db) {
    try {
        const count = db.prepare("SELECT COUNT(*) as c FROM leave_requests").get().c;
        if (count === 0) {
            const sampleLeaves = [
                ['LR-1001', 'STF-003', 'CASUAL', '2026-10-05', '2026-10-06', 'Attending family wedding ceremony in Jaipur', 'PENDING', null],
                ['LR-1002', 'STF-008', 'SICK', '2026-09-28', '2026-09-29', 'Severe seasonal viral fever; physician advised rest', 'APPROVED', 'Principal Meera Iyer'],
                ['LR-1003', 'STF-004', 'EARNED', '2026-10-12', '2026-10-14', 'Participating in CBSE / NCERT STEM Workshop in New Delhi', 'PENDING', null]
            ];
            const insert = db.prepare(`
                INSERT OR IGNORE INTO leave_requests (id, staff_id, leave_type, start_date, end_date, reason, status, approved_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            sampleLeaves.forEach(l => insert.run(...l));
        }
    } catch (e) {
        console.error('Failed to seed sample leaves:', e.message);
    }
}

// GET /api/staff - List all staff with full name projection
router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const staff = db.prepare(`
            SELECT *, 
                   (first_name || ' ' || COALESCE(last_name, '')) as name
            FROM staff 
            ORDER BY department, role, first_name
        `).all();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/staff/stats - HR Pulse & Department KPIs
router.get('/stats', (req, res) => {
    try {
        const db = req.app.locals.db;
        const totalStaff = db.prepare("SELECT COUNT(*) as count FROM staff WHERE status = 'ACTIVE'").get().count;
        const teachersCount = db.prepare("SELECT COUNT(*) as count FROM staff WHERE role = 'Teacher' AND status = 'ACTIVE'").get().count;
        const supportCount = db.prepare("SELECT COUNT(*) as count FROM staff WHERE role != 'Teacher' AND status = 'ACTIVE'").get().count;
        const pendingLeaves = db.prepare("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'PENDING'").get().count;
        const totalPayroll = db.prepare("SELECT COALESCE(SUM(base_salary), 0) as total FROM staff WHERE status = 'ACTIVE'").get().total;

        const deptCounts = db.prepare(`
            SELECT department, COUNT(*) as count 
            FROM staff 
            WHERE status = 'ACTIVE' 
            GROUP BY department
        `).all();

        res.json({
            totalStaff,
            teachersCount,
            supportCount,
            pendingLeaves,
            totalPayrollBudget: totalPayroll,
            deptCounts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/staff - Onboard new staff member
router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { firstName, lastName, role, department, subject, phone, email, baseSalary, joinDate } = req.body;

        if (!firstName || !role) {
            return res.status(400).json({ error: 'First name and role are required' });
        }

        // Generate next ID STF-XXX
        const count = db.prepare("SELECT COUNT(*) as c FROM staff").get().c;
        const id = `STF-${String(count + 1).padStart(3, '0')}`;
        const today = new Date().toISOString().split('T')[0];

        db.prepare(`
            INSERT INTO staff (id, first_name, last_name, role, department, subject, phone, email, base_salary, join_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
        `).run(
            id,
            firstName.trim(),
            (lastName || '').trim(),
            role,
            department || 'Academics',
            subject || null,
            phone || null,
            email || null,
            Number(baseSalary) || 30000,
            joinDate || today
        );

        const newStaff = db.prepare(`
            SELECT *, (first_name || ' ' || COALESCE(last_name, '')) as name 
            FROM staff WHERE id = ?
        `).get(id);

        res.json({ message: 'Staff member onboarded successfully', staff: newStaff });
    } catch (err) {
        console.error('Staff creation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/staff/attendance
router.get('/attendance', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { month, year } = req.query;
        const m = month ? String(month).padStart(2, '0') : new Date().toISOString().slice(5, 7);
        const y = year || new Date().getFullYear().toString();
        const pattern = `${y}-${m}-%`;
        const att = db.prepare(`
            SELECT a.*, 
                   s.first_name, s.last_name, 
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as staff_name,
                   s.role, s.department
            FROM staff_attendance a
            JOIN staff s ON a.staff_id = s.id
            WHERE a.date LIKE ?
            ORDER BY a.date DESC
        `).all(pattern);
        res.json(att);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/staff/leaves - List all leave requests joined with staff details
router.get('/leaves', (req, res) => {
    try {
        const db = req.app.locals.db;
        ensureSampleLeaves(db);

        const leaves = db.prepare(`
            SELECT l.*, 
                   s.first_name, s.last_name,
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as staff_name,
                   s.role, s.department, s.phone, s.email
            FROM leave_requests l
            JOIN staff s ON l.staff_id = s.id
            ORDER BY 
               CASE WHEN l.status = 'PENDING' THEN 1 ELSE 2 END,
               l.created_at DESC
        `).all();
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/staff/leave - Create a leave application
router.post('/leave', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { staffId, leaveType, startDate, endDate, reason, substituteId } = req.body;

        if (!staffId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Staff member, start date, and end date are required' });
        }

        // Normalize leaveType to uppercase
        let normalizedType = (leaveType || 'CASUAL').toUpperCase();
        if (!['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'UNPAID'].includes(normalizedType)) {
            normalizedType = 'CASUAL';
        }

        const id = 'LR-' + uuid().slice(0, 8).toUpperCase();
        db.prepare(`
            INSERT INTO leave_requests (id, staff_id, leave_type, start_date, end_date, reason, substitute_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).run(id, staffId, normalizedType, startDate, endDate, reason || '', substituteId || null);

        res.json({ id, message: 'Leave application submitted successfully' });
    } catch (err) {
        console.error('Leave submission error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/staff/leave/:id/approve - Approve a leave request
router.patch('/leave/:id/approve', (req, res) => {
    try {
        const db = req.app.locals.db;
        const approvedBy = req.body.approvedBy || 'Principal Meera Iyer';
        db.prepare(`
            UPDATE leave_requests 
            SET status = 'APPROVED', approved_by = ? 
            WHERE id = ?
        `).run(approvedBy, req.params.id);

        res.json({ message: 'Leave request approved successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/staff/leave/:id/reject - Reject a leave request
router.patch('/leave/:id/reject', (req, res) => {
    try {
        const db = req.app.locals.db;
        db.prepare(`
            UPDATE leave_requests 
            SET status = 'REJECTED' 
            WHERE id = ?
        `).run(req.params.id);

        res.json({ message: 'Leave request rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/staff/substitutes - List substitute assignments
router.get('/substitutes', (req, res) => {
    try {
        const db = req.app.locals.db;
        const subs = db.prepare(`
            SELECT sa.*,
                   (s1.first_name || ' ' || COALESCE(s1.last_name, '')) as original_teacher_name,
                   s1.subject as original_subject,
                   (s2.first_name || ' ' || COALESCE(s2.last_name, '')) as substitute_teacher_name,
                   s2.role as substitute_role
            FROM substitute_assignments sa
            JOIN staff s1 ON sa.original_teacher_id = s1.id
            JOIN staff s2 ON sa.substitute_teacher_id = s2.id
            ORDER BY sa.assignment_date DESC, sa.period_number ASC
        `).all();
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/staff/substitute/assign - Assign substitute teacher
router.post('/substitute/assign', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { leaveId, originalTeacherId, substituteTeacherId, assignmentDate, periodNumber, grade, section, notes } = req.body;

        if (!originalTeacherId || !substituteTeacherId || !assignmentDate) {
            return res.status(400).json({ error: 'Original teacher, substitute teacher, and assignment date required' });
        }

        const id = 'SUB-' + uuid().slice(0, 8).toUpperCase();
        db.prepare(`
            INSERT INTO substitute_assignments (id, leave_id, original_teacher_id, substitute_teacher_id, assignment_date, period_number, grade, section, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED')
        `).run(id, leaveId || null, originalTeacherId, substituteTeacherId, assignmentDate, periodNumber || 1, grade || 'Grade 1', section || 'A', notes || '');

        res.json({ message: 'Substitute teacher assigned successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
