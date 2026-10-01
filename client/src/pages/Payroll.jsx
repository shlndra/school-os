import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, 
  FileText, 
  Download, 
  CheckCircle2, 
  Calendar, 
  Info, 
  User, 
  X, 
  Printer,
  TrendingDown,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export default function Payroll() {
  const [month, setMonth] = useState('09');
  const [year, setYear] = useState('2026');
  const [runs, setRuns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [activePayslipModal, setActivePayslipModal] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchRuns = (autoSelectMonthYear = null) => {
    fetch('/api/payroll')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setRuns(list);
        
        if (autoSelectMonthYear) {
          const match = list.find(r => r.month === autoSelectMonthYear.month && String(r.year) === String(autoSelectMonthYear.year));
          if (match) {
            loadPayslips(match.id);
            return;
          }
        }
        
        if (list.length > 0 && !selectedRun) {
          loadPayslips(list[0].id);
          setMonth(list[0].month);
          setYear(String(list[0].year));
        }
      })
      .catch(err => {
        console.error('Failed to load payroll runs:', err);
        setRuns([]);
      });
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const loadPayslips = (runId) => {
    setSelectedRun(runId);
    const targetRun = runs.find(r => r.id === runId);
    if (targetRun) {
      setMonth(targetRun.month);
      setYear(String(targetRun.year));
    }
    fetch(`/api/payroll/${runId}/payslips`)
      .then(res => res.json())
      .then(data => {
        setPayslips(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to load payslips:', err);
        setPayslips([]);
      });
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    const existing = runs.find(r => r.month === newMonth && String(r.year) === String(year));
    if (existing) {
      loadPayslips(existing.id);
    } else {
      setSelectedRun(null);
      setPayslips([]);
    }
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    const existing = runs.find(r => r.month === month && String(r.year) === String(newYear));
    if (existing) {
      loadPayslips(existing.id);
    } else {
      setSelectedRun(null);
      setPayslips([]);
    }
  };

  const processPayroll = () => {
    setProcessing(true);
    fetch('/api/payroll/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year })
    })
      .then(res => res.json())
      .then(data => {
        setProcessing(false);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[parseInt(month, 10) - 1] || `Month ${month}`;
        setFeedbackMsg(`✓ Payroll for ${monthName} ${year} processed successfully! 12 staff payslips updated.`);
        fetchRuns({ month, year });
        setTimeout(() => setFeedbackMsg(''), 5000);
      })
      .catch(err => {
        setProcessing(false);
        alert('Payroll calculation failed: ' + err.message);
      });
  };

  const selectedRunObj = runs.find(r => r.id === selectedRun);
  const runExistsForSelectedMonth = runs.some(r => r.month === month && String(r.year) === String(year));

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Payroll & Salary Management</h2>
        <p className="text-slate-500 mt-1">Automated attendance-based salary calculation and digital payslip issuance</p>
      </div>

      {/* Logic Explainer Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-blue-900">How Monthly Salaries Are Calculated:</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-slate-600">
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-800">1. Working Days:</span> Excludes Sundays automatically.
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-800">2. Present & Leaves:</span> Present days & approved leaves receive 100% pay.
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-800">3. Deductions:</span> Unexcused absences deducted as: <span className="font-mono text-[11px]">(Base Salary ÷ Working Days) × Absences</span>.
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="font-bold text-slate-800">4. Allowances:</span> +10% HRA (House Rent Allowance) added to base pay.
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-sm">{feedbackMsg}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Month</label>
            <select 
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs" 
              value={month} 
              onChange={e => handleMonthChange(e.target.value)}
            >
              {Array.from({length: 12}, (_, i) => {
                const m = (i + 1).toString().padStart(2, '0');
                return <option key={m} value={m}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Year</label>
            <input 
              type="number" 
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm w-24 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs" 
              value={year} 
              onChange={e => handleYearChange(e.target.value)} 
            />
          </div>
          <button 
            onClick={processPayroll} 
            disabled={processing}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 text-white ${
              runExistsForSelectedMonth 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            <PlayCircle size={18} />
            <span>
              {processing 
                ? 'Calculating Attendance & Salaries...' 
                : (runExistsForSelectedMonth ? 'Recalculate & Update Payroll' : 'Process Monthly Payroll')}
            </span>
          </button>
        </div>

        {selectedRunObj && (
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-400 block">Total Payout</span>
              <span className="text-lg font-extrabold text-slate-800">
                ₹{Number(selectedRunObj.total_amount || selectedRunObj.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-xs text-slate-400 block">Staff Count</span>
              <span className="text-lg font-bold text-slate-800">{payslips.length} Staff</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Payroll Runs History */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 font-bold text-slate-800 text-sm flex items-center justify-between">
            <span>Historical Payroll Runs</span>
            <span className="text-xs font-normal text-slate-500">{runs.length} runs</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {runs.map(run => {
              const isSelected = selectedRun === run.id;
              const totalVal = Number(run.total_amount || run.totalAmount || 0);
              return (
                <div 
                  key={run.id} 
                  onClick={() => loadPayslips(run.id)}
                  className={`p-4 cursor-pointer transition-all flex justify-between items-center ${
                    isSelected 
                      ? 'bg-blue-50/70 border-l-4 border-blue-600 shadow-2xs' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{run.month}/{run.year}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch #{run.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-800 text-base">
                      ₹{totalVal.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                      {run.status || 'PROCESSED'}
                    </span>
                  </div>
                </div>
              );
            })}
            {runs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No payroll runs found. Click "Process Monthly Payroll" above.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payslips Table */}
        <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 font-bold text-slate-800 text-sm flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-slate-600" />
              <span>Staff Salary Breakdown {selectedRunObj ? `(${selectedRunObj.month}/${selectedRunObj.year})` : ''}</span>
            </div>
            {payslips.length > 0 && (
              <span className="text-xs text-slate-500 font-medium">Click 📄 to view full itemized slip</span>
            )}
          </div>

          {selectedRun ? (
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Staff Name & Role</th>
                    <th className="px-4 py-3 text-right">Base Salary</th>
                    <th className="px-4 py-3 text-center">Days (Work/Pres/Abs)</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Salary</th>
                    <th className="px-4 py-3 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map(ps => {
                    const base = Number(ps.baseSalary || ps.base_salary || 0);
                    const net = Number(ps.netSalary || ps.net_salary || 0);
                    const deductions = Number(ps.deductions || 0);
                    const working = ps.workingDays || ps.working_days || 26;
                    const present = ps.presentDays || ps.present_days || 0;
                    const leave = ps.leaveDays || ps.leave_days || 0;
                    const unpaid = ps.unpaidLeaveDays || ps.unpaid_leave_days || 0;

                    return (
                      <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{ps.staffName}</div>
                          <div className="text-xs text-slate-400 font-medium">{ps.role} • {ps.department || 'Academics'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-slate-600">
                          ₹{base.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-mono">
                          <span className="text-slate-700 font-bold">{working}</span> /{' '}
                          <span className="text-emerald-600 font-bold">{present}</span> /{' '}
                          <span className={unpaid > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>{unpaid}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                          {deductions > 0 ? (
                            <span className="text-red-600 font-bold">-₹{deductions.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-400 font-medium">₹0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-700 text-base">
                          ₹{net.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button 
                            onClick={() => setActivePayslipModal(ps)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 p-1.5 rounded-lg transition-colors border border-blue-200"
                            title="View Itemized Payslip"
                          >
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400 text-sm">
                        No payslips generated for this run.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <FileText size={40} className="mb-2 opacity-30" />
              <span>Select a payroll run from the left list to view staff payslips</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Itemized Payslip View */}
      {activePayslipModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">School OS Official Payslip</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pay Period: {month}/{year} • Payslip ID: {activePayslipModal.id}</p>
              </div>
              <button 
                onClick={() => setActivePayslipModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Staff Card */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-800 text-base">{activePayslipModal.staffName}</div>
                <div className="text-xs text-slate-500 font-medium">{activePayslipModal.role} • {activePayslipModal.department || 'Staff'}</div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                PAID VIA BANK TRANSFER
              </span>
            </div>

            {/* Attendance Days Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs my-3 bg-white border border-slate-200 p-2.5 rounded-xl">
              <div>
                <span className="text-slate-400 block">Total Days</span>
                <span className="font-bold text-slate-700 text-sm">{activePayslipModal.workingDays || activePayslipModal.working_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Present</span>
                <span className="font-bold text-emerald-600 text-sm">{activePayslipModal.presentDays || activePayslipModal.present_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Leave</span>
                <span className="font-bold text-blue-600 text-sm">{activePayslipModal.leaveDays || activePayslipModal.leave_days}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Absent</span>
                <span className="font-bold text-red-600 text-sm">{activePayslipModal.unpaidLeaveDays || activePayslipModal.unpaid_leave_days}</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="border-t border-b border-slate-100 py-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Base Monthly Salary</span>
                <span className="font-semibold">₹{Number(activePayslipModal.baseSalary || activePayslipModal.base_salary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>House Rent Allowance (HRA 10%)</span>
                <span className="font-semibold">+₹{Number(activePayslipModal.allowances || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Unpaid Absence Deductions</span>
                <span className="font-semibold">-₹{Number(activePayslipModal.deductions || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Net Total */}
            <div className="pt-3 pb-4 flex justify-between items-baseline">
              <span className="font-bold text-slate-800 text-base">Net Disbursed Salary</span>
              <span className="font-extrabold text-2xl text-emerald-700">
                ₹{Number(activePayslipModal.netSalary || activePayslipModal.net_salary || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Action */}
            <button
              onClick={() => setActivePayslipModal(null)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              Close Payslip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
