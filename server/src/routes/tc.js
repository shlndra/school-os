const router = require('express').Router();

function ensureSampleTCs(db, tcService) {
    try {
        const count = db.prepare("SELECT COUNT(*) as c FROM transfer_certificates").get().c;
        if (count < 2) {
            // Seed a TC with pending clearances: STU-008 (Kabir Joshi)
            const stu8 = db.prepare("SELECT * FROM students WHERE id = 'STU-008'").get();
            if (stu8) {
                db.prepare(`
                    INSERT OR IGNORE INTO transfer_certificates (id, student_id, request_date, reason, finance_cleared, library_cleared, transport_cleared, academic_cleared, status)
                    VALUES ('TC-1002', 'STU-008', date('now', '-2 days'), 'Relocating to Dehradun for boarding school admission', 0, 0, 1, 1, 'CLEARANCE_IN_PROGRESS')
                `).run();
            }

            // Seed an already issued TC: STU-012 (Dhruv Kapoor)
            const stu12 = db.prepare("SELECT * FROM students WHERE id = 'STU-012'").get();
            if (stu12) {
                db.prepare(`
                    INSERT OR IGNORE INTO transfer_certificates (id, student_id, request_date, reason, finance_cleared, library_cleared, transport_cleared, academic_cleared, status, signed_by, signed_at, tc_number)
                    VALUES ('TC-1003', 'STU-012', date('now', '-10 days'), 'Completed elementary stage; transferring to DPS R.K. Puram', 1, 1, 1, 1, 'ISSUED', 'Principal Meera Iyer', datetime('now', '-5 days'), 'SCH/2026/3891')
                `).run();
            }
        }
    } catch (e) {
        console.error('Error ensuring sample TCs:', e.message);
    }
}

// GET /api/tc - List all TCs with student details
router.get('/', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const db = req.app.locals.db;
        ensureSampleTCs(db, tcService);

        const tcs = tcService.getTCs();
        res.json(tcs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tc/stats - TC Summary metrics
router.get('/stats', (req, res) => {
    try {
        const db = req.app.locals.db;
        const total = db.prepare("SELECT COUNT(*) as c FROM transfer_certificates").get().c;
        const inProgress = db.prepare("SELECT COUNT(*) as c FROM transfer_certificates WHERE status = 'CLEARANCE_IN_PROGRESS'").get().c;
        const readyToSign = db.prepare("SELECT COUNT(*) as c FROM transfer_certificates WHERE status = 'ALL_CLEARED'").get().c;
        const issued = db.prepare("SELECT COUNT(*) as c FROM transfer_certificates WHERE status = 'ISSUED'").get().c;

        res.json({
            total,
            inProgress,
            readyToSign,
            issued
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tc/:id - Get clearance detail and student data
router.get('/:id', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const db = req.app.locals.db;
        const tcInfo = tcService.getTC(req.params.id);

        // Fetch student & guardian details for official certificate
        const student = db.prepare(`
            SELECT s.*, 
                   g.name as guardianName, g.relation, g.phone as guardianPhone, g.email as guardianEmail
            FROM students s
            LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = 1
            WHERE s.id = ?
        `).get(tcInfo.studentId);

        res.json({
            ...tcInfo,
            studentInfo: student,
            guardianName: student?.guardianName || 'Parent / Guardian',
            guardianPhone: student?.guardianPhone || 'N/A'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tc/request - Create TC application
router.post('/request', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const { studentId, reason } = req.body;
        if (!studentId || !reason) {
            return res.status(400).json({ error: 'Student and reason for leaving are required' });
        }
        const result = tcService.requestTC(studentId, reason);
        res.json({ message: 'TC Requested successfully', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/tc/:id/sign - Principal digitally signs and issues TC
router.post('/:id/sign', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const { signedBy } = req.body;
        const result = tcService.signTC(req.params.id, signedBy || 'Principal Meera Iyer');
        res.json({ message: 'TC Signed and Issued officially', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/tc/:id/clear-library - Clear library dues
router.post('/:id/clear-library', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const result = tcService.clearLibraryDues(req.params.id);
        res.json({ message: 'Library books marked returned and cleared', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/tc/:id/clear-finance - Clear finance dues
router.post('/:id/clear-finance', (req, res) => {
    try {
        const tcService = req.app.locals.tcService;
        const result = tcService.clearFinanceDues(req.params.id);
        res.json({ message: 'Fee dues settled and cleared', result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
