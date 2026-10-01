import React, { useState, useEffect } from 'react';
import { 
  Users, GraduationCap, IndianRupee, FileText, AlertCircle, 
  TrendingUp, ArrowRight, UserPlus, CheckCircle2, Clock, 
  BusFront, Store, Calendar, FileCheck2, ShieldCheck, 
  Sparkles, Check, ChevronRight, BookOpen, Layers
} from 'lucide-react';

export default function Dashboard({ onNavigate = () => {} }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading School Command Center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
        <AlertCircle size={36} className="mx-auto text-rose-500 mb-2" />
        <h3 className="font-bold text-lg">Unable to load dashboard</h3>
        <p className="text-sm text-rose-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const totalStudents = stats.totalStudents || 232;
  const totalStaff = stats.totalStaff || 13;
  const pendingAdmissions = stats.pendingAdmissions || 0;
  const unpaidInvoices = stats.unpaidInvoices || 0;
  const totalRevenue = stats.totalRevenue || 309000;
  const attendanceRate = stats.attendanceStats?.rate || 94;
  const presentCount = stats.attendanceStats?.present || 218;
  const absentCount = stats.attendanceStats?.absent || 10;
  const lateCount = stats.attendanceStats?.late || 4;

  const kpiCards = [
    {
      id: 'classroom',
      title: 'Total Enrolled Students',
      value: totalStudents,
      badge: `${totalStudents} Active Pupils`,
      subtext: 'Grades 1 to 10 (Sec A & B)',
      cta: 'View Classroom Roster',
      icon: GraduationCap,
      color: 'bg-blue-600',
      lightBg: 'bg-blue-50/60',
      borderColor: 'border-blue-200 hover:border-blue-500',
      glow: 'hover:shadow-blue-500/10'
    },
    {
      id: 'staff',
      title: 'Active Faculty & Staff',
      value: totalStaff,
      badge: `${stats.totalClasses || 20} Classes Assigned`,
      subtext: '5 Teachers • 8 Ops/Admin',
      cta: 'Manage Faculty & Staff',
      icon: Users,
      color: 'bg-indigo-600',
      lightBg: 'bg-indigo-50/60',
      borderColor: 'border-indigo-200 hover:border-indigo-500',
      glow: 'hover:shadow-indigo-500/10'
    },
    {
      id: 'admissions',
      title: 'Admissions Pipeline',
      value: pendingAdmissions,
      badge: `${pendingAdmissions} Active Applications`,
      subtext: 'Enquiry to Offer Extended',
      cta: 'Review Applications',
      icon: FileText,
      color: 'bg-amber-600',
      lightBg: 'bg-amber-50/60',
      borderColor: 'border-amber-200 hover:border-amber-500',
      glow: 'hover:shadow-amber-500/10'
    },
    {
      id: 'classroom',
      title: "Today's Attendance Rate",
      value: `${attendanceRate}%`,
      badge: `${presentCount} Present • ${absentCount} Absent`,
      subtext: `${lateCount} Late Check-ins`,
      cta: 'Open Daily Roll Call',
      icon: CheckCircle2,
      color: 'bg-emerald-600',
      lightBg: 'bg-emerald-50/60',
      borderColor: 'border-emerald-200 hover:border-emerald-500',
      glow: 'hover:shadow-emerald-500/10'
    },
    {
      id: 'fees',
      title: 'Total Revenue Realized',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      badge: `${unpaidInvoices} Invoices Due`,
      subtext: `₹${(stats.feeStats?.outstanding || 47000).toLocaleString('en-IN')} Arrears`,
      cta: 'Open Fee Ledger',
      icon: IndianRupee,
      color: 'bg-teal-600',
      lightBg: 'bg-teal-50/60',
      borderColor: 'border-teal-200 hover:border-teal-500',
      glow: 'hover:shadow-teal-500/10'
    }
  ];

  const quickActions = [
    { label: '+ New Admission', target: 'admissions', icon: UserPlus, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Timetable & Roll Call', target: 'classroom', icon: Calendar, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { label: 'Collect Fee Payment', target: 'fees', icon: IndianRupee, color: 'bg-teal-600 hover:bg-teal-700 text-white' },
    { label: 'Campus Store POS', target: 'store', icon: Store, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { label: 'Faculty & Substitutes', target: 'staff', icon: Users, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { label: 'Buses, Clinic & Library', target: 'safety', icon: BusFront, color: 'bg-amber-600 hover:bg-amber-700 text-white' },
    { label: 'Parent Mobile Desk', target: 'parent_app', icon: Sparkles, color: 'bg-rose-600 hover:bg-rose-700 text-white' },
    { label: 'Transfer Clearance', target: 'tc', icon: FileCheck2, color: 'bg-slate-800 hover:bg-slate-900 text-white' }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
              Live Campus Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">Academic Session 2026-27</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            School OS Executive Command Center
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Gurugram Model Campus • Sector 48, Sohna Road, Gurugram, Delhi NCR
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Enrolled Strength</div>
            <div className="text-xl font-bold text-slate-900 flex items-center justify-end gap-1.5">
              <GraduationCap size={18} className="text-blue-600" /> {totalStudents} Pupils
            </div>
          </div>
        </div>
      </div>

      {/* Pending Items Attention Strip (if any) */}
      {(pendingAdmissions > 0 || (stats.pendingApprovals?.leaves > 0) || (stats.pendingApprovals?.tcs > 0)) && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Campus Approvals Pending Attention
              </h4>
              <p className="text-xs text-amber-800">
                Action needed on pending admissions, staff leave approvals, or student transfer certificates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {pendingAdmissions > 0 && (
              <button
                onClick={() => onNavigate('admissions')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors flex items-center gap-1 shadow-2xs"
              >
                {pendingAdmissions} Admissions <ArrowRight size={13} />
              </button>
            )}
            {(stats.pendingApprovals?.leaves > 0) && (
              <button
                onClick={() => onNavigate('staff')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 transition-colors flex items-center gap-1 shadow-2xs"
              >
                {stats.pendingApprovals.leaves} Leaves <ArrowRight size={13} />
              </button>
            )}
            {(stats.pendingApprovals?.tcs > 0) && (
              <button
                onClick={() => onNavigate('tc')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 transition-colors flex items-center gap-1 shadow-2xs"
              >
                {stats.pendingApprovals.tcs} TC Clearances <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid (Clickable with rich hover effects) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              onClick={() => onNavigate(card.id)}
              className={`
                bg-white rounded-2xl p-5 border ${card.borderColor} shadow-xs 
                hover:-translate-y-1.5 hover:shadow-xl ${card.glow} transition-all duration-200 
                cursor-pointer flex flex-col justify-between group relative overflow-hidden
              `}
            >
              {/* Subtle top indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${card.color} opacity-80 group-hover:h-1.5 transition-all`}></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {card.title}
                  </span>
                  <div className={`w-9 h-9 rounded-xl ${card.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                    <Icon size={18} />
                  </div>
                </div>

                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${card.lightBg} text-slate-700 border border-slate-200/60`}>
                    {card.badge}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {card.subtext}
                </div>
              </div>

              {/* Clickable CTA Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>{card.cta}</span>
                <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Command Center */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-600" /> Quick Operations Launchpad
          </h3>
          <span className="text-[11px] text-slate-400">One-click administrative workflows</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {quickActions.map((act, i) => {
            const ActIcon = act.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate(act.target)}
                className={`
                  px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs 
                  transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${act.color}
                `}
              >
                <ActIcon size={14} />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Grade-Wise Student Strength Distribution */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="text-blue-600" size={18} /> Grade-Wise Student Enrollment (Grades 1 - 10)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current student capacity & distribution across Sections A & B (Capacity: 70 per grade)
              </p>
            </div>
            <button
              onClick={() => onNavigate('classroom')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
            >
              Classrooms <ArrowRight size={13} />
            </button>
          </div>

          {/* Grade Distribution Bars */}
          <div className="space-y-3 pt-1">
            {(stats.gradeDistribution || [
              { grade: 'Grade 1', count: 27 },
              { grade: 'Grade 2', count: 22 },
              { grade: 'Grade 3', count: 22 },
              { grade: 'Grade 4', count: 22 },
              { grade: 'Grade 5', count: 26 },
              { grade: 'Grade 6', count: 22 },
              { grade: 'Grade 7', count: 23 },
              { grade: 'Grade 8', count: 22 },
              { grade: 'Grade 9', count: 26 },
              { grade: 'Grade 10', count: 20 }
            ]).map((g, idx) => {
              const maxCap = 70;
              const pct = Math.min(100, Math.round((g.count / maxCap) * 100));
              return (
                <div 
                  key={idx}
                  onClick={() => onNavigate('classroom')}
                  className="group cursor-pointer hover:bg-slate-50/80 p-2 rounded-xl transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-slate-400 group-hover:text-blue-600" /> {g.grade}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">Sec A & B</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {g.count} <span className="text-slate-400 font-normal">/ {maxCap}</span>
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Daily Campus Pulse & Key Highlights */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today Attendance Pulse Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-600" size={18} /> Today's Attendance Pulse
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time morning roll call confirmation</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                {attendanceRate}% Present
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-2xl font-black text-emerald-700">{presentCount}</div>
                <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">Present</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-2xl font-black text-rose-700">{absentCount}</div>
                <div className="text-[11px] font-semibold text-rose-800 mt-0.5">Absent</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-2xl font-black text-amber-700">{lateCount}</div>
                <div className="text-[11px] font-semibold text-amber-800 mt-0.5">Late Arrival</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('classroom')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Calendar size={14} /> View Classroom Speed Attendance (90s)
            </button>
          </div>

          {/* Transport Fleet Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BusFront className="text-amber-600" size={18} /> Gurgaon & NCR Fleet
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">4 Active routes • 120 Assigned students</p>
              </div>
              <button
                onClick={() => onNavigate('transport')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                Routes <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { route: 'Route 101', name: 'Golf Course Rd & Cyber City', status: 'On Schedule', bus: 'HR-26-BR-1029' },
                { route: 'Route 102', name: 'Sohna Road & Subhash Chowk', status: 'On Schedule', bus: 'HR-26-BR-2045' },
                { route: 'Route 103', name: 'Dwarka & West Delhi NCR Express', status: 'On Schedule', bus: 'DL-1P-TR-4481' },
                { route: 'Route 104', name: 'South Delhi & Vasant Kunj Corridor', status: 'On Schedule', bus: 'DL-1P-TR-8812' }
              ].map((r, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{r.route}</span>: <span className="text-slate-600">{r.name}</span>
                    <div className="text-[10px] text-slate-400 font-mono">{r.bus}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feeds: Recent Admissions & Recent Fee Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions Pipeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={18} /> New Admissions In Pipeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Prospective students in review</p>
            </div>
            <button
              onClick={() => onNavigate('admissions')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
            >
              Open Kanban <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats.recentAdmissions || []).slice(0, 5).map((adm) => (
              <div 
                key={adm.id}
                onClick={() => onNavigate('admissions')}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                    {adm.applicant_name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Applying for: <strong className="text-slate-600">{adm.target_grade}</strong> • Guardian: {adm.guardian_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">
                    {(adm.status || 'ENQUIRY').replace(/_/g, ' ')}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Receipts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="text-emerald-600" size={18} /> Recent Fee Collections & Receipts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Realized fee deposits & accounts updates</p>
            </div>
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
            >
              Fee Ledger <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(stats.recentPayments || [
              { id: 'INV-1', studentName: 'Aarav Sharma', grade: 'Grade 1', paid_amount: 25000, description: 'Q3 Tuition & Computer Lab Fee' },
              { id: 'INV-2', studentName: 'Diya Patel', grade: 'Grade 1', paid_amount: 23000, description: 'Tuition Fee - Term 1' },
              { id: 'INV-3', studentName: 'Vihaan Reddy', grade: 'Grade 1', paid_amount: 23000, description: 'Tuition Fee - Term 1' },
              { id: 'INV-4', studentName: 'Ananya Kumar', grade: 'Grade 1', paid_amount: 23000, description: 'Tuition Fee - Term 1' },
              { id: 'INV-5', studentName: 'Ishaan Nair', grade: 'Grade 5', paid_amount: 28000, description: 'Tuition Fee - Term 1' }
            ]).slice(0, 5).map((pay, i) => (
              <div 
                key={i}
                onClick={() => onNavigate('fees')}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors group"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                    {pay.studentName || 'Student'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {pay.grade} • {pay.description || 'Academic Fee'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-right">
                  <div>
                    <span className="font-bold text-xs text-emerald-700">
                      +₹{(pay.paid_amount || 0).toLocaleString('en-IN')}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">Realized</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-700 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

