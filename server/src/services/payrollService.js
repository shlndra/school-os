const { v4: uuid } = require('uuid');

/**
 * Payroll Service
 * Calculates monthly salaries based on attendance, leaves, and base pay.
 */
class PayrollService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calculate payroll for a given month/year.
   */
  processPayroll(month, year) {
    const monthStr = String(month).padStart(2, '0');
    const datePrefix = `${year}-${monthStr}`;

    // Check if run already exists (allow recalculating and updating)
    const existing = this.db.prepare('SELECT * FROM payroll_runs WHERE month = ? AND year = ?').get(monthStr, year);

    // Count working days in the month (exclude Sundays)
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow !== 0) totalWorkingDays++; // Skip Sundays
    }

    // Get all active staff
    const allStaff = this.db.prepare("SELECT * FROM staff WHERE status = 'ACTIVE'").all();

    const payrollId = existing ? existing.id : 'PAY-' + uuid().slice(0, 8).toUpperCase();
    let totalPayrollAmount = 0;
    const payslips = [];

    const txn = this.db.transaction(() => {
      // Create or update payroll run
      if (!existing) {
        this.db.prepare(
          'INSERT INTO payroll_runs (id, month, year, status) VALUES (?,?,?,?)'
        ).run(payrollId, monthStr, year, 'DRAFT');
      }

      // Delete old payslips for re-processing
      this.db.prepare('DELETE FROM payslips WHERE payroll_id = ?').run(payrollId);

      const insertPayslip = this.db.prepare(`
        INSERT INTO payslips (id, payroll_id, staff_id, base_salary, working_days, present_days, leave_days, unpaid_leave_days, deductions, allowances, net_salary)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `);

      allStaff.forEach(staff => {
        // Count attendance
        const attendance = this.db.prepare(`
          SELECT 
            COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present,
            COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
            COUNT(CASE WHEN status = 'ON_LEAVE' THEN 1 END) as on_leave,
            COUNT(CASE WHEN status = 'HALF_DAY' THEN 1 END) as half_day
          FROM staff_attendance
          WHERE staff_id = ? AND date LIKE ?
        `).get(staff.id, datePrefix + '%');

        const totalMarked = (attendance?.present || 0) + (attendance?.absent || 0) + (attendance?.on_leave || 0) + (attendance?.half_day || 0);

        let presentDays, leaveDays, absentDays;
        if (totalMarked > 0) {
          presentDays = (attendance?.present || 0) + ((attendance?.half_day || 0) * 0.5);
          leaveDays = attendance?.on_leave || 0;
          absentDays = attendance?.absent || 0;
        } else {
          // If attendance is not yet recorded for this month, default to full working days
          presentDays = totalWorkingDays;
          leaveDays = 0;
          absentDays = 0;
        }

        // Check approved leaves
        const approvedLeaves = this.db.prepare(`
          SELECT COUNT(*) as count FROM leave_requests
          WHERE staff_id = ? AND status = 'APPROVED'
          AND start_date <= ? AND end_date >= ?
        `).get(staff.id, `${datePrefix}-${daysInMonth}`, `${datePrefix}-01`);

        // Unpaid leave deduction: absences that are not approved leave
        const unpaidLeaveDays = absentDays;
        const perDaySalary = staff.base_salary / totalWorkingDays;
        const deductions = unpaidLeaveDays * perDaySalary;

        // Simple allowance: 10% HRA
        const allowances = Math.round(staff.base_salary * 0.10);

        const netSalary = Math.round(staff.base_salary + allowances - deductions);

        const payslipId = 'PS-' + uuid().slice(0, 8).toUpperCase();
        insertPayslip.run(
          payslipId, payrollId, staff.id, staff.base_salary,
          totalWorkingDays, Math.round(presentDays), leaveDays, unpaidLeaveDays,
          Math.round(deductions), allowances, netSalary
        );

        totalPayrollAmount += netSalary;

        payslips.push({
          id: payslipId,
          staffId: staff.id,
          staffName: `${staff.first_name} ${staff.last_name}`,
          role: staff.role,
          baseSalary: staff.base_salary,
          workingDays: totalWorkingDays,
          presentDays: Math.round(presentDays),
          leaveDays,
          unpaidLeaveDays,
          deductions: Math.round(deductions),
          allowances,
          netSalary
        });
      });

      // Update payroll run
      this.db.prepare(
        'UPDATE payroll_runs SET total_amount = ?, status = ?, processed_at = datetime(?) WHERE id = ?'
      ).run(totalPayrollAmount, 'PROCESSED', new Date().toISOString(), payrollId);
    });

    txn();

    return {
      payrollId,
      month: monthStr,
      year,
      totalWorkingDays,
      totalStaff: allStaff.length,
      totalAmount: totalPayrollAmount,
      payslips,
      status: 'PROCESSED'
    };
  }

  getPayrollRuns() {
    return this.db.prepare('SELECT * FROM payroll_runs ORDER BY year DESC, month DESC').all();
  }

  getPayslips(payrollId) {
    return this.db.prepare(`
      SELECT p.*, s.first_name, s.last_name, s.role, s.department
      FROM payslips p
      JOIN staff s ON p.staff_id = s.id
      WHERE p.payroll_id = ?
      ORDER BY s.role, s.first_name
    `).all(payrollId);
  }
}

module.exports = PayrollService;
