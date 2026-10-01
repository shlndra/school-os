const router = require('express').Router();
const { v4: uuid } = require('uuid');

router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const admissions = db.prepare(`SELECT * FROM admissions ORDER BY created_at DESC`).all();
        // Normalize fields for frontend convenience
        const normalized = admissions.map(a => ({
            id: a.id,
            name: a.applicant_name,
            grade: a.target_grade,
            parentContact: a.guardian_phone,
            parentName: a.guardian_name,
            dob: a.date_of_birth,
            status: a.status,
            createdAt: a.created_at
        }));
        res.json(normalized);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const body = req.body || {};
        
        const applicantName = body.name || body.applicantName || 'New Applicant';
        const targetGrade = body.grade || body.targetGrade || 'Grade 1';
        const guardianPhone = body.parentContact || body.guardianPhone || '';
        const guardianName = body.guardianName || body.parentName || 'Parent/Guardian';
        const dateOfBirth = body.dob || body.dateOfBirth || '2018-01-01';
        const guardianEmail = body.guardianEmail || '';

        const newId = 'ADM-' + uuid().slice(0, 8).toUpperCase();
        
        db.prepare(`
            INSERT INTO admissions (id, applicant_name, date_of_birth, target_grade, guardian_name, guardian_phone, guardian_email, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ENQUIRY_RECEIVED', datetime('now'), datetime('now'))
        `).run(newId, applicantName, dateOfBirth, targetGrade, guardianName, guardianPhone, guardianEmail);
        
        res.json({ id: newId, message: 'Admission created successfully' });
    } catch (err) {
        console.error('Error creating admission:', err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/advance', (req, res) => {
    try {
        const db = req.app.locals.db;
        const id = req.params.id;
        const body = req.body || {};
        
        const admission = db.prepare(`SELECT * FROM admissions WHERE id = ?`).get(id);
        if (!admission) return res.status(404).json({ error: 'Admission not found' });
        
        if (body.rejectionReason) {
            db.prepare(`UPDATE admissions SET status = 'REJECTED', updated_at = datetime('now') WHERE id = ?`).run(id);
            return res.json({ message: 'Admission rejected' });
        }
        
        // Logical progression through the pipeline
        const stateTransitions = {
            'ENQUIRY_RECEIVED': 'DOCUMENTS_VERIFIED',
            'DOCUMENTS_PENDING': 'DOCUMENTS_VERIFIED',
            'DOCUMENTS_VERIFIED': 'INTERVIEW_SCHEDULED',
            'INTERVIEW_SCHEDULED': 'OFFER_EXTENDED',
            'EVALUATION_COMPLETE': 'OFFER_EXTENDED',
            'OFFER_EXTENDED': 'ENROLLED',
            'FEES_CLEARED': 'ENROLLED'
        };
        
        const nextState = stateTransitions[admission.status];
        if (!nextState) return res.status(400).json({ error: 'Cannot advance from current state: ' + admission.status });
        
        const txn = db.transaction(() => {
            db.prepare(`UPDATE admissions SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextState, id);
            
            // If student is finally enrolled, create student record and guardian
            if (nextState === 'ENROLLED') {
                const studentId = 'STU-' + uuid().slice(0, 8).toUpperCase();
                const nameParts = (admission.applicant_name || '').trim().split(' ');
                const firstName = nameParts[0] || 'Student';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                db.prepare(`
                    INSERT INTO students (id, first_name, last_name, date_of_birth, gender, blood_group, grade, section, admission_date, status, wallet_balance)
                    VALUES (?, ?, ?, ?, 'Other', 'O+', ?, 'A', date('now'), 'ACTIVE', 1000.0)
                `).run(studentId, firstName, lastName, admission.date_of_birth || '2018-01-01', admission.target_grade || 'Grade 1');
                
                const guardianId = 'GUR-' + uuid().slice(0, 8).toUpperCase();
                db.prepare(`
                    INSERT INTO guardians (id, student_id, name, relation, phone, email, is_primary)
                    VALUES (?, ?, ?, 'Guardian', ?, ?, 1)
                `).run(guardianId, studentId, admission.guardian_name || 'Guardian', admission.guardian_phone || '', admission.guardian_email || '');
            }
        });
        
        txn();
        
        res.json({ message: `Advanced to ${nextState}` });
    } catch (err) {
        console.error('Error advancing admission:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
