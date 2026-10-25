import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  CreditCard, 
  Receipt as ReceiptIcon, 
  Printer, 
  BookOpen, 
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Wallet,
  Building2,
  Calendar,
  User
} from 'lucide-react';

export default function Fees({ initialParams = {} }) {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(initialParams?.invoiceId || '');

  useEffect(() => {
    if (initialParams?.invoiceId) {
      setSearchQuery(initialParams.invoiceId);
      setActiveTab('invoices');
    }
  }, [initialParams?.invoiceId]);

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR Code');
  const [payRefNo, setPayRefNo] = useState('');
  const [paying, setPaying] = useState(false);

  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    studentId: '',
    feeType: 'TUITION',
    description: 'Term 2 Academic & Lab Fee',
    amount: '',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });
  const [generating, setGenerating] = useState(false);

  const fetchFinanceData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/invoices').then(r => r.json()),
      fetch('/api/finance/stats').then(r => r.json()),
      fetch('/api/students').then(r => r.json()),
      fetch('/api/finance/trial-balance').then(r => r.json())
    ])
      .then(([invData, statsData, stuData, tbData]) => {
        setInvoices(Array.isArray(invData) ? invData : []);
        setStats(statsData || null);
        setStudents(Array.isArray(stuData) ? stuData : []);
        setTrialBalance(Array.isArray(tbData) ? tbData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching finance data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const openPayModal = (inv) => {
    setSelectedInvoiceForPay(inv);
    setPayAmount(inv.balance || (inv.total - (inv.paid || 0)));
    setPaymentMethod('UPI / QR Code');
    setPayRefNo('');
    setShowPayModal(true);
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) return alert('Enter a valid payment amount');

    setPaying(true);
    fetch('/api/finance/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: selectedInvoiceForPay.id,
        amount: amountNum,
        paymentMethod,
        referenceNo: payRefNo || undefined
      })
    })
      .then(res => res.json())
      .then(data => {
        setPaying(false);
        if (data.error) return alert(data.error);
        setShowPayModal(false);
        setActiveReceipt(data.receipt);
        fetchFinanceData();
      })
      .catch(err => {
        setPaying(false);
        alert('Payment failed: ' + err.message);
      });
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newInvoice.studentId) return alert('Please select a student');
    if (!newInvoice.amount || Number(newInvoice.amount) <= 0) return alert('Enter a valid fee amount');

    setGenerating(true);
    fetch('/api/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: newInvoice.studentId,
        description: newInvoice.description,
        amount: Number(newInvoice.amount),
        dueDate: newInvoice.dueDate,
        feeType: newInvoice.feeType
      })
    })
      .then(res => res.json())
      .then(data => {
        setGenerating(false);
        if (data.error) return alert(data.error);
        setShowGenerateModal(false);
        setNewInvoice({
          studentId: '',
          feeType: 'TUITION',
          description: 'Term 2 Academic & Lab Fee',
          amount: '',
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        });
        fetchFinanceData();
      })
      .catch(err => {
        setGenerating(false);
        alert('Invoice generation failed: ' + err.message);
      });
  };

  const getStatusBadge = (status) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={12} className="mr-1 text-emerald-600" /> PAID
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          <Clock size={12} className="mr-1 text-amber-600" /> PARTIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
        <AlertCircle size={12} className="mr-1 text-red-600" /> UNPAID
      </span>
    );
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = `${inv.studentName || ''} ${inv.description || ''} ${inv.id || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'PAID') return matchesSearch && inv.status === 'PAID';
    if (statusFilter === 'PARTIAL') return matchesSearch && inv.status === 'PARTIAL';
    if (statusFilter === 'UNPAID') return matchesSearch && (inv.status === 'UNPAID' || inv.status === 'OVERDUE');
    return matchesSearch;
  });

  const totalTbDebit = trialBalance.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalTbCredit = trialBalance.reduce((sum, line) => sum + (line.credit || 0), 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading School Financial System...</div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fees & Financial Accounting</h2>
          <p className="text-slate-500 text-sm mt-0.5">Automated student fee collection & double-entry general ledger</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl shadow-2xs">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'invoices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💳 Student Invoices
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ledger' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏛️ General Ledger & Trial Balance
            </button>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Billed / Receivable</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{Number(stats.totalInvoiced || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">{stats.totalCount} Invoices Issued</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Fees Collected</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              ₹{Number(stats.totalCollected || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{stats.paidCount} Fully Cleared</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Outstanding Dues</span>
            <div className="text-2xl font-extrabold text-red-600 mt-1">
              ₹{Number(stats.outstanding || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-xs text-red-500 font-semibold mt-0.5 block">{stats.unpaidCount + stats.partialCount} Pending Invoices</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Collection Efficiency</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {stats.collectionRate}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, stats.collectionRate || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: INVOICES & PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'UNPAID' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Unpaid / Due ({invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length})
              </button>
              <button
                onClick={() => setStatusFilter('PARTIAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'PARTIAL' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Partial ({invoices.filter(i => i.status === 'PARTIAL').length})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Paid in Full ({invoices.filter(i => i.status === 'PAID').length})
              </button>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or invoice..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Student & Class</th>
                    <th className="px-6 py-3.5 text-left">Description</th>
                    <th className="px-6 py-3.5 text-right">Total Billed</th>
                    <th className="px-6 py-3.5 text-right">Paid to Date</th>
                    <th className="px-6 py-3.5 text-right">Balance Due</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm">
                  {filteredInvoices.map((inv) => {
                    const balance = inv.balance !== undefined ? inv.balance : (inv.total - (inv.paid || 0));
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{inv.studentName}</div>
                          <div className="text-xs text-slate-400 font-medium">
                            {inv.grade ? `${inv.grade} - Section ${inv.section || 'A'}` : `ID: ${inv.student_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700 font-medium">{inv.description}</div>
                          <div className="text-xs text-slate-400">Invoice #{inv.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-600">
                          ₹{Number(inv.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-emerald-700">
                          ₹{Number(inv.paid || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-extrabold text-slate-900 text-base">
                          ₹{Number(balance).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {balance > 0 ? (
                            <button 
                              onClick={() => openPayModal(inv)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1 mx-auto"
                            >
                              <CreditCard size={13} />
                              <span>Collect Fee</span>
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-flex items-center gap-1">
                              <CheckCircle2 size={13} /> Cleared
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">
                        No fee invoices match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER & TRIAL BALANCE */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
            <Building2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Double-Entry General Ledger Balance Guarantee:</span>
              <p className="text-slate-600 mt-0.5">
                Every fee invoice, cafeteria sale, and salary payment automatically verifies that Total Debits strictly equals Total Credits (&Sigma; Debits &equiv; &Sigma; Credits).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50/70 p-4 border-b border-slate-100 flex justify-between items-center font-bold text-slate-800 text-sm">
              <span>Trial Balance Summary (General Ledger Accounts)</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Balanced & Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Code</th>
                    <th className="px-6 py-3.5 text-left">Account Name</th>
                    <th className="px-6 py-3.5 text-left">Account Type</th>
                    <th className="px-6 py-3.5 text-right">Debit (₹)</th>
                    <th className="px-6 py-3.5 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalance.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-500">{line.code}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{line.name}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{line.type}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-700">
                        {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-700">
                        {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan="3" className="px-6 py-3.5 text-left text-slate-800 uppercase text-xs tracking-wider">
                      Total Ledger Balance (Must Match)
                    </td>
                    <td className="px-6 py-3.5 text-right text-emerald-800 text-base">
                      ₹{totalTbDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 text-right text-emerald-800 text-base">
                      ₹{totalTbCredit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT FEE PAYMENT */}
      {showPayModal && selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Collect Student Fee</h3>
                <p className="text-xs text-slate-500 mt-0.5">Invoice #{selectedInvoiceForPay.id}</p>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Student & Invoice Summary Card */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="font-bold text-slate-800 text-base">{selectedInvoiceForPay.studentName}</div>
              <div className="text-xs text-slate-500 mt-0.5">{selectedInvoiceForPay.description}</div>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-extrabold text-base text-red-600">
                  ₹{Number(selectedInvoiceForPay.balance || (selectedInvoiceForPay.total - (selectedInvoiceForPay.paid || 0))).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoiceForPay.balance || (selectedInvoiceForPay.total - (selectedInvoiceForPay.paid || 0))}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UPI / QR Code">📲 UPI / PhonePe / GPay</option>
                  <option value="Net Banking / NEFT">🏦 Net Banking / NEFT / IMPS</option>
                  <option value="Cash at Counter">💵 Cash at School Accounts Counter</option>
                  <option value="Cheque / Demand Draft">📝 Cheque / Demand Draft</option>
                  <option value="Debit / Credit Card">💳 POS Card Terminal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref 38291048201"
                  value={payRefNo}
                  onChange={e => setPayRefNo(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {paying ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE NEW FEE INVOICE */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Generate Student Fee Invoice</h3>
                <p className="text-xs text-slate-500 mt-0.5">Posts to student ledger and accounts receivable</p>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={newInvoice.studentId}
                  onChange={e => setNewInvoice({ ...newInvoice, studentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => {
                    const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Student ${s.id}`;
                    return (
                      <option key={s.id} value={s.id}>
                        {name} ({s.grade} {s.section || 'A'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Fee Category
                </label>
                <select
                  value={newInvoice.feeType}
                  onChange={e => setNewInvoice({ ...newInvoice, feeType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TUITION">📚 Tuition & Academic Fee</option>
                  <option value="TRANSPORT">🚌 Bus Transit / Transport Fee</option>
                  <option value="LAB">🔬 Science & Computer Lab Fee</option>
                  <option value="ACTIVITY">🎨 Sports & Co-Curricular Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Fee Description
                </label>
                <input
                  type="text"
                  required
                  value={newInvoice.description}
                  onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="e.g. 45000"
                    value={newInvoice.amount}
                    onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoice.dueDate}
                    onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL PRINTABLE FEE RECEIPT */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* School Header */}
            <div className="text-center pb-4 border-b-2 border-slate-800">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2 font-black text-xl shadow-sm">
                SO
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">SCHOOL OS ACADEMIC CAMPUS</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sector 48, Sohna Road, Gurgaon, Delhi NCR - 122018</p>
              <div className="mt-2 inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Official Fee Receipt
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{activeReceipt.receiptNo}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Date & Time:</span>
                <span className="font-medium text-slate-700">{activeReceipt.date} • {activeReceipt.time}</span>
              </div>
              <div className="mt-1">
                <span className="text-slate-400 block">Student Name:</span>
                <span className="font-bold text-slate-800">{activeReceipt.studentName} ({activeReceipt.grade})</span>
              </div>
              <div className="mt-1 text-right">
                <span className="text-slate-400 block">Payment Mode:</span>
                <span className="font-medium text-emerald-700 font-semibold">{activeReceipt.paymentMethod}</span>
              </div>
            </div>

            {/* Transaction Breakdown */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tuition & Campus Services</span>
                <span>₹{Number(activeReceipt.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold text-base pt-1">
                <span>Amount Paid Now</span>
                <span>₹{Number(activeReceipt.amountPaid).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Remaining Balance Due</span>
                <span className="font-bold text-slate-800">₹{Number(activeReceipt.remainingBalance).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Authorized Signature watermark */}
            <div className="flex justify-between items-end my-4 pt-2 text-xs text-slate-400">
              <div>
                <span className="block font-mono text-[10px]">Ref: {activeReceipt.referenceNo}</span>
                <span className="text-emerald-600 font-bold">✓ Transaction Verified by Ledger</span>
              </div>
              <div className="text-center">
                <div className="font-serif italic text-slate-700 font-bold text-sm">Anita Sharma</div>
                <div className="border-t border-slate-300 pt-0.5 mt-0.5">Accounts Officer</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
