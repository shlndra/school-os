const router = require('express').Router();

router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { grade, section } = req.query;
        let query = `SELECT *, (first_name || ' ' || COALESCE(last_name, '')) as name FROM students WHERE status='ACTIVE'`;
        let params = [];
        if (grade) {
            query += ` AND grade = ?`;
            params.push(grade);
        }
        if (section) {
            query += ` AND section = ?`;
            params.push(section);
        }
        query += ` ORDER BY grade, section, first_name`;
        const students = db.prepare(query).all(...params);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', (req, res) => {
    try {
        const db = req.app.locals.db;
        const studentId = req.params.id;
        const student = db.prepare(`SELECT *, (first_name || ' ' || COALESCE(last_name, '')) as name FROM students WHERE id = ?`).get(studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        const guardians = db.prepare(`SELECT * FROM guardians WHERE student_id = ?`).all(studentId);
        student.guardians = guardians;
        
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
