const router = require('express').Router();

router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const totalStudents = db.prepare(`SELECT count(*) as count FROM students WHERE status='ACTIVE'`).get().count;
        const totalStaff = db.prepare(`SELECT count(*) as count FROM staff WHERE status='ACTIVE'`).get().count;
        const totalClasses = db.prepare(`SELECT count(*) as count FROM class_sections`).get().count;
        const pendingAdmissions = db.prepare(`SELECT count(*) as count FROM admissions WHERE status NOT IN ('ENROLLED', 'REJECTED')`).get().count;
        const unpaidInvoices = db.prepare(`SELECT count(*) as count FROM fee_invoices WHERE status IN ('UNPAID', 'PARTIAL', 'OVERDUE')`).get().count;
        
        // Financial summary
        const feeStats = db.prepare(`
            SELECT 
                COALESCE(SUM(total_amount), 0) as totalInvoiced,
                COALESCE(SUM(paid_amount), 0) as totalCollected,
                COALESCE(SUM(total_amount - paid_amount), 0) as outstanding
            FROM fee_invoices
        `).get();
        const totalRevenue = feeStats.totalCollected;
        
        // Recent admissions
        const recentAdmissions = db.prepare(`SELECT * FROM admissions ORDER BY created_at DESC LIMIT 5`).all();
        
        // Today attendance breakdown
        const today = new Date().toISOString().split('T')[0];
        const attRows = db.prepare(`
            SELECT status, count(*) as count 
            FROM student_attendance 
            WHERE date = ? 
            GROUP BY status
        `).all(today);

        let present = 0, absent = 0, late = 0;
        attRows.forEach(r => {
            if (r.status === 'PRESENT') present = r.count;
            if (r.status === 'ABSENT') absent = r.count;
            if (r.status === 'LATE') late = r.count;
        });
        const totalMarked = present + absent + late;
        const attendanceRate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 95;

        // Grade distribution
        const gradeDistribution = db.prepare(`
            SELECT grade, count(*) as count 
            FROM students 
            WHERE status='ACTIVE' 
            GROUP BY grade 
            ORDER BY 
               CASE 
                 WHEN grade = 'Grade 1' THEN 1
                 WHEN grade = 'Grade 2' THEN 2
                 WHEN grade = 'Grade 3' THEN 3
                 WHEN grade = 'Grade 4' THEN 4
                 WHEN grade = 'Grade 5' THEN 5
                 WHEN grade = 'Grade 6' THEN 6
                 WHEN grade = 'Grade 7' THEN 7
                 WHEN grade = 'Grade 8' THEN 8
                 WHEN grade = 'Grade 9' THEN 9
                 WHEN grade = 'Grade 10' THEN 10
                 ELSE 11 END
        `).all();

        // Recent fee transactions
        const recentPayments = db.prepare(`
            SELECT f.id, f.description, f.paid_amount, f.status, f.created_at,
                   s.first_name, s.last_name, 
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as studentName,
                   s.grade
            FROM fee_invoices f
            JOIN students s ON f.student_id = s.id
            WHERE f.paid_amount > 0
            ORDER BY f.created_at DESC
            LIMIT 5
        `).all();

        // Transport
        const assignedTransport = db.prepare(`SELECT count(DISTINCT student_id) as count FROM student_transport`).get().count;

        // Pending items needing attention
        const pendingLeaves = db.prepare(`SELECT count(*) as count FROM leave_requests WHERE status='PENDING'`).get().count;
        const pendingTCs = db.prepare(`SELECT count(*) as count FROM transfer_certificates WHERE status IN ('CLEARANCE_IN_PROGRESS', 'ALL_CLEARED')`).get().count;

        res.json({
            totalStudents,
            totalStaff,
            totalClasses,
            pendingAdmissions,
            unpaidInvoices,
            totalRevenue,
            recentAdmissions,
            attendanceToday: totalMarked,
            attendanceStats: {
                present,
                absent,
                late,
                rate: attendanceRate
            },
            gradeDistribution,
            recentPayments,
            feeStats,
            transportStats: {
                assignedStudents: assignedTransport,
                activeRoutes: 4
            },
            pendingApprovals: {
                admissions: pendingAdmissions,
                leaves: pendingLeaves,
                tcs: pendingTCs
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
