import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, CheckCircle2, XCircle, FileSignature, AlertCircle, 
  Search, Calendar, Printer, X, User, IndianRupee, BookOpen, 
  Bus, GraduationCap, Check, Clock, ShieldCheck, ArrowRight, Sparkles
} from 'lucide-react';

export default function TransferCertificate() {
  const [tcs, setTcs] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTc, setSelectedTc] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [requestData, setRequestData] = useState({ 
    studentId: '', 
    reason: 'Parent job relocation to another city',
    destinationCity: 'Bengaluru'
  });
  const [actionMessage, setActionMessage] = useState('');

  const fetchTcs = async (autoSelectId = null) => {
    try {
      const [tcsRes, statsRes] = await Promise.all([
        fetch('/api/tc').then(r => r.json()),
        fetch('/api/tc/stats').then(r => r.json())
      ]);

      const list = Array.isArray(tcsRes) ? tcsRes : [];
      setTcs(list);
      setStats(statsRes || null);

      if (list.length > 0) {
        const targetId = autoSelectId || selectedTc?.id || list[0].id;
        loadTcDetail(targetId);
      }
    } catch (err) {
      console.error('Error fetching TCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTcs();
    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []));
  }, []);

  const triggerToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const loadTcDetail = async (id) => {
    try {
      const res = await fetch(`/api/tc/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTc(data);
      }
    } catch (err) {
      console.error('Error loading TC detail:', err);
    }
  };

  // Submit new TC request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const combinedReason = `${requestData.reason} (Destination: ${requestData.destinationCity})`;
      const res = await fetch('/api/tc/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: requestData.studentId, 
          reason: combinedReason 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowRequestModal(false);
        setRequestData({ 
          studentId: '', 
          reason: 'Parent job relocation to another city',
          destinationCity: 'Bengaluru'
        });
        triggerToast('📋 Transfer Certificate request initiated. Department clearance checks started.');
        fetchTcs(data.result?.tcId);
      } else {
        alert(data.error || 'Failed to request TC');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Sign and issue TC
  const handleSignTC = async () => {
    if (!selectedTc) return;
    try {
      const res = await fetch(`/api/tc/${selectedTc.id || selectedTc.tcId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedBy: 'Principal Meera Iyer' })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('🎓 Transfer Certificate signed and officially issued!');
        await loadTcDetail(selectedTc.id || selectedTc.tcId);
        fetchTcs(selectedTc.id || selectedTc.tcId);
        setShowCertificateModal(true);
      } else {
        alert(data.error || 'Failed to sign TC');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Clear Library
  const handleQuickClearLibrary = async (tcId) => {
    try {
      const res = await fetch(`/api/tc/${tcId}/clear-library`, { method: 'POST' });
      if (res.ok) {
        triggerToast('📚 Library books returned. Library clearance verified.');
        loadTcDetail(tcId);
        fetchTcs(tcId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Clear Finance
  const handleQuickClearFinance = async (tcId) => {
    try {
      const res = await fetch(`/api/tc/${tcId}/clear-finance`, { method: 'POST' });
      if (res.ok) {
        triggerToast('💰 Fee arrears settled. Finance clearance verified.');
        loadTcDetail(tcId);
        fetchTcs(tcId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered list
  const filteredTcs = tcs.filter(tc => {
    const name = tc.studentName || `${tc.first_name || ''} ${tc.last_name || ''}`;
    const matchesSearch = 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tc.student_id && tc.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tc.id && tc.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tc.grade && tc.grade.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage('')} className="text-emerald-100 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="text-blue-600" /> Transfer Certificate (TC) Hub
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            4-Department clearance verification, student withdrawal audit, and official CBSE Leaving Certificates
          </p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors shadow-sm self-start md:self-auto"
        >
          <FileCheck2 size={16} className="mr-2 text-blue-400" /> + Request Transfer Certificate
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
            <FileCheck2 size={14} className="text-slate-600" /> Total TC Requests
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total ?? tcs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Academic Year 2026-27</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-amber-600" /> In Clearance Queue
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats?.inProgress ?? 0}</div>
          <div className="text-xs text-amber-600 mt-1">Pending fee / library returns</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-800 flex items-center gap-1.5 mb-1">
            <ShieldCheck size={14} className="text-blue-600" /> Ready to Sign
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats?.readyToSign ?? 0}</div>
          <div className="text-xs text-blue-600 mt-1">All 4 departments cleared</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={14} className="text-emerald-600" /> Issued Certificates
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats?.issued ?? 0}</div>
          <div className="text-xs text-emerald-600 mt-1">Archived to student alumni</div>
        </div>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Requests Master List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Search & Filter Toolbar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, ID, or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All TCs' },
                { id: 'CLEARANCE_IN_PROGRESS', label: 'In Progress' },
                { id: 'ALL_CLEARED', label: 'Ready to Sign' },
                { id: 'ISSUED', label: 'Issued' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
            {filteredTcs.map(tc => {
              const fullName = tc.studentName || `${tc.first_name || ''} ${tc.last_name || ''}` || 'Student';
              const isSelected = (selectedTc?.id === tc.id || selectedTc?.tcId === tc.id);
              
              // Count clearances
              const clearedCount = (tc.finance_cleared ? 1 : 0) + (tc.library_cleared ? 1 : 0) + (tc.transport_cleared ? 1 : 0) + (tc.academic_cleared ? 1 : 0);

              return (
                <div 
                  key={tc.id} 
                  onClick={() => loadTcDetail(tc.id)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/70 border-l-4 border-blue-600' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        tc.status === 'ISSUED' ? 'bg-emerald-600' : tc.status === 'ALL_CLEARED' ? 'bg-blue-600' : 'bg-amber-600'
                      }`}>
                        {fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{fullName}</h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {tc.student_id} • {tc.grade} {tc.section ? `(${tc.section})` : ''}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${
                      tc.status === 'ISSUED' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : tc.status === 'ALL_CLEARED' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tc.status === 'CLEARANCE_IN_PROGRESS' ? 'IN PROGRESS' : tc.status === 'ALL_CLEARED' ? 'READY TO SIGN' : 'ISSUED'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <p className="truncate max-w-[220px]" title={tc.reason}>
                      {tc.reason || 'Reason not specified'}
                    </p>
                    <span className="font-medium text-[11px] text-slate-600">
                      {tc.status === 'ISSUED' ? (
                        <span className="text-emerald-700 font-mono font-bold">{tc.tc_number || 'ISSUED'}</span>
                      ) : (
                        `${clearedCount}/4 Cleared`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredTcs.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <FileCheck2 size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No transfer certificates found</p>
                <p className="text-xs text-slate-400 mt-1">Click "+ Request Transfer Certificate" to begin an application</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Clearance Verification & Signing Terminal (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTc ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-6">
              {/* Top Banner Card */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {selectedTc.tcId || selectedTc.id}
                      </span>
                      {selectedTc.tcNumber && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          CBSE TC #{selectedTc.tcNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                      {selectedTc.studentName || selectedTc.student}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: <span className="font-semibold text-slate-700">{selectedTc.grade}</span> • 
                      Guardian: <span className="font-semibold text-slate-700">{selectedTc.guardianName || 'Parent'}</span> • 
                      DOB: <span className="font-semibold text-slate-700">{selectedTc.dateOfBirth || '2019-01-05'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedTc.status === 'ISSUED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : selectedTc.status === 'ALL_CLEARED'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {selectedTc.status === 'CLEARANCE_IN_PROGRESS' ? 'CLEARANCES PENDING' : selectedTc.status === 'ALL_CLEARED' ? 'VERIFIED • READY TO SIGN' : 'OFFICIALLY ISSUED'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {selectedTc.signedAt ? `Signed on ${new Date(selectedTc.signedAt).toLocaleDateString()}` : 'Exit audit in progress'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex items-start gap-2">
                  <span className="font-semibold text-slate-700 whitespace-nowrap">Reason for Leaving:</span>
                  <span className="italic">{selectedTc.reason || 'Relocation'}</span>
                </div>
              </div>

              {/* Clearance Cards Grid */}
              <div className="px-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-blue-600" /> Mandatory 4-Department Clearances
                  </h4>
                  <span className="text-xs text-slate-500">
                    {selectedTc.allCleared || selectedTc.status === 'ALL_CLEARED' || selectedTc.status === 'ISSUED' 
                      ? '4 of 4 Verified' 
                      : 'Requires all 4 to enable signing'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. Finance & Accounts */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedTc.clearances?.finance?.cleared 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${selectedTc.clearances?.finance?.cleared ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <IndianRupee size={16} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Accounts & Fee Dues</span>
                      </div>
                      {selectedTc.clearances?.finance?.cleared ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-rose-600" />
                      )}
                    </div>
                    <p className={`text-xs ${selectedTc.clearances?.finance?.cleared ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedTc.clearances?.finance?.message || 'Verification complete'}
                    </p>
                    {!selectedTc.clearances?.finance?.cleared && selectedTc.status !== 'ISSUED' && (
                      <button
                        onClick={() => handleQuickClearFinance(selectedTc.id || selectedTc.tcId)}
                        className="mt-2.5 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 py-1 rounded shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Check size={12} /> Settle Dues & Clear Finance
                      </button>
                    )}
                  </div>

                  {/* 2. Library */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedTc.clearances?.library?.cleared 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${selectedTc.clearances?.library?.cleared ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <BookOpen size={16} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Library & Textbooks</span>
                      </div>
                      {selectedTc.clearances?.library?.cleared ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-rose-600" />
                      )}
                    </div>
                    <p className={`text-xs ${selectedTc.clearances?.library?.cleared ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedTc.clearances?.library?.message || 'All books checked in'}
                    </p>
                    {!selectedTc.clearances?.library?.cleared && selectedTc.status !== 'ISSUED' && (
                      <button
                        onClick={() => handleQuickClearLibrary(selectedTc.id || selectedTc.tcId)}
                        className="mt-2.5 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-medium px-2.5 py-1 rounded shadow-xs transition-colors flex items-center gap-1"
                      >
                        <Check size={12} /> Return Books & Clear Library
                      </button>
                    )}
                  </div>

                  {/* 3. Transport */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedTc.clearances?.transport?.cleared 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${selectedTc.clearances?.transport?.cleared ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <Bus size={16} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Transport & Bus Pass</span>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-700">
                      {selectedTc.clearances?.transport?.message || 'Bus pass and route seat eligible for release'}
                    </p>
                  </div>

                  {/* 4. Academic */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    selectedTc.clearances?.academic?.cleared 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${selectedTc.clearances?.academic?.cleared ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <GraduationCap size={16} />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">Academics & Conduct</span>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-xs text-emerald-700">
                      {selectedTc.clearances?.academic?.message || 'Cumulative marks recorded • Conduct certified Good'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                {selectedTc.status === 'ISSUED' ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 text-xs text-emerald-800 font-medium">
                      <Sparkles size={16} className="text-emerald-600" />
                      <span>This Transfer Certificate is officially signed and registered in school archives.</span>
                    </div>
                    <button
                      onClick={() => setShowCertificateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Printer size={15} /> View Official CBSE Leaving Certificate
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      {selectedTc.allCleared ? (
                        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-blue-600" /> All 4 departments cleared. Ready for Principal's digital signature.
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                          <AlertCircle size={15} className="text-amber-600" /> Please clear outstanding department items above to unlock signature.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleSignTC}
                      disabled={!selectedTc.allCleared}
                      className={`flex items-center px-6 py-2.5 rounded-lg font-bold text-xs text-white transition-all shadow-sm ${
                        selectedTc.allCleared 
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:shadow-md cursor-pointer' 
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <FileSignature size={16} className="mr-2" /> Sign & Issue TC (Principal Meera Iyer)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 p-8 text-center">
              <FileCheck2 size={40} className="text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Select a TC request from the list</p>
              <p className="text-xs text-slate-400 mt-1">Review department clearances and proceed with Principal authorization</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: REQUEST TRANSFER CERTIFICATE */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck2 className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Initiate Transfer Certificate (TC)</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Active Student *</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={requestData.studentId}
                  onChange={(e) => setRequestData({ ...requestData, studentId: e.target.value })}
                >
                  <option value="">-- Choose enrolled student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name || `${s.first_name} ${s.last_name}`} • {s.grade} Sec {s.section} [{s.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Withdrawal / Transfer *</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 mb-2"
                  value={requestData.reason}
                  onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                >
                  <option value="Parent job relocation to another city">Parent job relocation to another city</option>
                  <option value="Shifting family residence within NCR">Shifting family residence within NCR</option>
                  <option value="Admission to specialized residential / boarding academy">Admission to specialized boarding academy</option>
                  <option value="Completed elementary schooling; moving to higher secondary">Completed elementary stage</option>
                  <option value="Personal / medical family reasons">Personal / family reasons</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City / Target School *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Noida / Bengaluru / Delhi Public School"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={requestData.destinationCity}
                  onChange={(e) => setRequestData({ ...requestData, destinationCity: e.target.value })}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle size={14} /> Automatic Clearance Trigger:
                </p>
                <p>
                  Upon submission, the system initiates real-time audits with Accounts (Fee arrears) and Library (Borrowed books).
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <FileCheck2 size={16} /> Submit TC Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICIAL CBSE TRANSFER CERTIFICATE PRINTABLE DOCUMENT */}
      {showCertificateModal && selectedTc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-300 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official School Leaving Document
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer size={14} /> Print Certificate
                </button>
                <button onClick={() => setShowCertificateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Certificate Sheet Format */}
            <div className="mt-6 border-4 border-double border-slate-800 p-8 rounded-lg bg-amber-50/20 text-slate-900 relative">
              {/* Watermark / Seal background */}
              <div className="text-center pb-6 border-b-2 border-slate-800">
                <div className="text-xs font-bold tracking-widest text-slate-600 uppercase">Affiliated to Central Board of Secondary Education (CBSE)</div>
                <h1 className="text-2xl font-black uppercase text-slate-900 tracking-wide mt-1">
                  School OS Model Senior Secondary School
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Sector 48, Sohna Road, Gurugram, Delhi NCR - 122018 • Phone: +91 124 4567890
                </p>
                <div className="flex justify-center items-center gap-6 mt-2 text-xs font-mono text-slate-600">
                  <span>Affiliation No.: <strong>CBSE/AFF/122018</strong></span>
                  <span>School Code: <strong>20491</strong></span>
                </div>
              </div>

              <div className="my-6 text-center">
                <span className="text-lg font-black uppercase tracking-widest px-4 py-1 border-b-2 border-slate-900">
                  TRANSFER CERTIFICATE
                </span>
                <div className="flex justify-between items-center text-xs font-mono text-slate-700 mt-4 px-2">
                  <span>Certificate No: <strong>{selectedTc.tcNumber || 'SCH/2026/8492'}</strong></span>
                  <span>Admission No: <strong>{selectedTc.studentId || selectedTc.student_id}</strong></span>
                </div>
              </div>

              {/* Numbered CBSE Format Rows */}
              <div className="space-y-2.5 text-xs text-slate-800">
                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">1. Name of the Pupil:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedTc.studentName || selectedTc.student}</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">2. Father's / Guardian's Name:</span>
                  <span className="font-bold text-slate-900">{selectedTc.guardianName || 'Mr. Guardian'}</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">3. Nationality:</span>
                  <span className="font-bold text-slate-900">Indian</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">4. Class in which pupil last studied:</span>
                  <span className="font-bold text-slate-900">{selectedTc.grade}</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">5. School / Board Annual Examination last taken:</span>
                  <span className="font-bold text-slate-900">Annual Evaluation 2026 - PASSED</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">6. Qualified for promotion to higher class:</span>
                  <span className="font-bold text-emerald-800">YES, QUALIFIED</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">7. Month up to which school dues have been paid:</span>
                  <span className="font-bold text-slate-900">OCTOBER 2026 (NO DUES PENDING)</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">8. General Conduct:</span>
                  <span className="font-bold text-slate-900">EXEMPLARY / GOOD</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                  <span className="font-semibold text-slate-600">9. Reason for leaving the school:</span>
                  <span className="font-semibold text-slate-900 italic">{selectedTc.reason || 'Parent relocation'}</span>
                </div>
              </div>

              {/* Signature Seal Block */}
              <div className="mt-12 pt-6 flex justify-between items-end text-center">
                <div className="space-y-1">
                  <div className="w-28 border-b border-slate-800 mx-auto"></div>
                  <div className="text-[11px] font-semibold text-slate-600">Class Teacher</div>
                </div>

                <div className="text-center">
                  <div className="inline-block p-2 border-2 border-emerald-700 rounded-full text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1 rotate-[-4deg]">
                    ★ ACCOUNTS & LIBRARY CLEARED ★
                  </div>
                  <div className="text-[10px] text-slate-400">Gurugram Campus Seal</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-serif font-bold text-blue-900 italic">Meera Iyer</div>
                  <div className="w-32 border-b-2 border-slate-800 mx-auto"></div>
                  <div className="text-[11px] font-bold text-slate-900">Principal</div>
                  <div className="text-[10px] text-slate-500">School OS Academic Campus</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

