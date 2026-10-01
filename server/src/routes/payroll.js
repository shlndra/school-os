const router = require('express').Router();

router.get('/', (req, res) => {
    try {
        const db = req.app.locals.db;
        const runs = db.prepare(`
            SELECT id, month, year, status, total_amount, total_amount as totalAmount,
                   processed_at, processed_at as processedDate, created_at
            FROM payroll_runs 
            ORDER BY year DESC, month DESC
        `).all();
        res.json(runs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/process', (req, res) => {
    try {
        const payrollService = req.app.locals.payrollService;
        const { month, year } = req.body;
        const result = payrollService.processPayroll(Number(month), Number(year));
        res.json({ message: 'Payroll processed', ...result, result });
    } catch (err) {
        console.error('Payroll process error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/payslips', (req, res) => {
    try {
        const db = req.app.locals.db;
        const payslips = db.prepare(`
            SELECT p.*, s.first_name, s.last_name, s.role, s.department,
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as staffName,
                   p.base_salary as baseSalary,
                   p.working_days as workingDays,
                   p.present_days as presentDays,
                   p.leave_days as leaveDays,
                   p.unpaid_leave_days as unpaidLeaveDays,
                   p.deductions as deductions,
                   p.allowances as allowances,
                   p.net_salary as netSalary
            FROM payslips p
            JOIN staff s ON p.staff_id = s.id
            WHERE p.payroll_id = ?
            ORDER BY s.role, s.first_name
        `).all(req.params.id);
        res.json(payslips);
    } catch (err) {
        console.error('Fetch payslips error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
