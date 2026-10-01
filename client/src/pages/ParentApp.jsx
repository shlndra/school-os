import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  MessageSquare, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Bus, 
  HeartPulse, 
  BookOpen, 
  CreditCard, 
  UserCheck, 
  Clock, 
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function ParentApp() {
  const [activeTab, setActiveTab] = useState('notices');

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
              Pillar 6: Parent Engagement
            </span>
            <span className="text-xs font-semibold text-slate-500">Live Parent & Student Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Parent & Student Mobile Desk</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Instant Circulars & Notices • 360° Student Progress Tracker • Direct Teacher Communication
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-2xs gap-1">
          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'notices' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('notices')}
          >
            <Bell size={15} />
            <span>Campus Circulars</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'progress' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('progress')}
          >
            <Smartphone size={15} />
            <span>Student 360° View</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'messages' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare size={15} />
            <span>Teacher Desk</span>
          </button>
        </div>
      </div>

      {activeTab === 'notices' && <NoticesTab />}
      {activeTab === 'progress' && <ProgressTab />}
      {activeTab === 'messages' && <MessagesTab />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: CAMPUS CIRCULARS & INSTANT NOTICES
// -------------------------------------------------------------
function NoticesTab() {
  const [notices, setNotices] = useState([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'ACADEMIC',
    targetAudience: 'ALL',
    content: '',
    isUrgent: false,
    author: 'Principal Office'
  });

  const fetchNotices = () => {
    setLoading(true);
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        setNotices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleBroadcast = (e) => {
    e.preventDefault();
    fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setModalOpen(false);
        setNotification('✓ Circular broadcasted to parent mobile apps and school portal!');
        setTimeout(() => setNotification(''), 4500);
        fetchNotices();
        setFormData({
          title: '',
          category: 'ACADEMIC',
          targetAudience: 'ALL',
          content: '',
          isUrgent: false,
          author: 'Principal Office'
        });
      })
      .catch(err => alert('Failed to publish circular: ' + err.message));
  };

  const filteredNotices = notices.filter(n => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'URGENT') return n.is_urgent === 1;
    return n.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'URGENT', 'ACADEMIC', 'EVENT', 'EMERGENCY'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat === 'URGENT' ? '🚨 Urgent Alerts' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>Broadcast New Circular</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      {/* Notices Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading school notices...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map(n => (
            <div 
              key={n.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                n.is_urgent ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {n.is_urgent === 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                        URGENT
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {n.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{n.published_date}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-base leading-snug">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {n.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">Issued by: <strong className="text-slate-700">{n.author || 'School Administration'}</strong></span>
                <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{n.target_audience}</span>
              </div>
            </div>
          ))}
          {filteredNotices.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
              No circulars found in this category.
            </div>
          )}
        </div>
      )}

      {/* Broadcast Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Broadcast Official Circular</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Science Exhibition 2026 - Registration Open"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="ACADEMIC">Academic Advisory</option>
                    <option value="EVENT">Event & Exhibition</option>
                    <option value="EMERGENCY">Emergency / Weather</option>
                    <option value="GENERAL">General Information</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Parents & Students</option>
                    <option value="PRIMARY">Primary Wing (Grades 1-5)</option>
                    <option value="MIDDLE">Middle Wing (Grades 6-8)</option>
                    <option value="SENIOR">Senior Wing (Grades 9-10)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Body / Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type official communication details..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issuing Authority</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="chkUrgent"
                  checked={formData.isUrgent}
                  onChange={e => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600"
                />
                <label htmlFor="chkUrgent" className="text-red-700 font-bold cursor-pointer">
                  Mark as High-Priority Urgent Alert (Sends Instant Push & SMS)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: STUDENT 360° PROGRESS TRACKER (PARENT VIEW)
// -------------------------------------------------------------
function ProgressTab() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].id);
          fetchProgress(list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchProgress = (id) => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/notices/student-progress/${id}`)
      .then(res => res.json())
      .then(data => {
        setProgress(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    fetchProgress(id);
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || (s.id && s.id.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Student Picker Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search child by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-52 sm:w-64"
            />
          </div>

          <select
            value={selectedStudentId}
            onChange={e => handleSelectStudent(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs max-w-[280px]"
          >
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.grade} - {s.section || 'A'})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          Parent Mobile App Simulation Mode
        </span>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading 360° student telemetry...
        </div>
      ) : progress && progress.student ? (
        <div className="space-y-6">
          {/* Child Identity Card */}
          <div className="bg-linear-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-extrabold text-2xl text-blue-200">
                {progress.student.first_name?.[0]}{progress.student.last_name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold">{progress.student.first_name} {progress.student.last_name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    Active Student
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  ID: <span className="font-mono font-bold text-white">{progress.student.id}</span> • {progress.student.grade} - Section {progress.student.section || 'A'}
                </p>
                <p className="text-xs text-blue-300 mt-0.5">
                  Guardian: {progress.student.guardian_name || 'Primary Guardian'} ({progress.student.guardian_phone || '+91 98110 00000'})
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
              <span className="text-xs text-blue-200 font-medium">Attendance Rate</span>
              <span className="text-2xl font-black text-emerald-400">{progress.attendance.percentage}%</span>
              <span className="text-[11px] text-blue-200">Target &gt;85% Achieved</span>
            </div>
          </div>

          {/* 4 Multi-Domain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. School Transport Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bus size={18} className="text-blue-600" />
                  <h4 className="font-bold text-slate-800 text-sm">School Bus Tracking</h4>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active Commuter
                </span>
              </div>

              {progress.transport ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Route:</span>
                    <span className="font-bold text-slate-800">{progress.transport.route_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Number:</span>
                    <span className="font-mono font-bold text-slate-800">{progress.transport.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Designated Stop:</span>
                    <span className="font-bold text-blue-700">{progress.transport.stop_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Morning Pickup Time:</span>
                    <span className="font-mono font-bold text-emerald-700">{progress.transport.pickup_time}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">Child not registered for school bus service.</p>
              )}
            </div>

            {/* 2. Fees & Invoices */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Fee Payment & Invoices</h4>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {progress.invoices.length} Invoices
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {progress.invoices.map(inv => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{inv.description}</div>
                      <div className="text-[11px] text-slate-400 font-mono">₹{inv.total_amount?.toLocaleString('en-IN')}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
                {progress.invoices.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">No pending fee dues. All receipts cleared.</p>
                )}
              </div>
            </div>

            {/* 3. Campus Clinic History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HeartPulse size={18} className="text-red-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Infirmary & Clinic Log</h4>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {progress.clinicVisits.length} visits
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto text-xs">
                {progress.clinicVisits.map(v => (
                  <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800">{v.symptoms}</span>
                      <span className="font-mono text-slate-400">{v.visit_date}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{v.treatment}</p>
                  </div>
                ))}
                {progress.clinicVisits.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">No clinic visits recorded. Student in robust health.</p>
                )}
              </div>
            </div>

            {/* 4. Library Borrowings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-purple-600" />
                  <h4 className="font-bold text-slate-800 text-sm">Issued Library Books</h4>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {progress.loans.length} active
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto text-xs">
                {progress.loans.map(loan => (
                  <div key={loan.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{loan.title}</div>
                      <div className="text-[11px] text-slate-400">Due: <strong className="text-blue-700">{loan.due_date}</strong></div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800">
                      {loan.status}
                    </span>
                  </div>
                ))}
                {progress.loans.length === 0 && (
                  <p className="text-xs text-slate-400 py-3">No active library books on loan.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 3: PARENT-TEACHER DESK (TWO-WAY MESSAGING SIMULATION)
// -------------------------------------------------------------
function MessagesTab() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'teacher',
      senderName: 'Priya Nair (Class Teacher - Grade 5A)',
      text: 'Good evening Mrs. Sharma! Aarav performed exceptionally well in today’s Mathematics quiz on fractions. Please ensure he completes page 44 by tomorrow.',
      timestamp: 'Yesterday at 4:30 PM'
    },
    {
      id: 2,
      sender: 'parent',
      senderName: 'Rajesh Sharma (Parent)',
      text: 'Thank you Priya ma’am! We worked through the questions together. Also, will the CBSE AI Exhibition transport be available from Sohna Road?',
      timestamp: 'Today at 8:15 AM'
    },
    {
      id: 3,
      sender: 'teacher',
      senderName: 'Priya Nair (Class Teacher - Grade 5A)',
      text: 'Yes! Route 102 covers Sector 48 Sohna Road directly at 07:15 AM as usual.',
      timestamp: 'Today at 9:00 AM'
    }
  ]);

  const [replyText, setReplyText] = useState('');

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'parent',
      senderName: 'You (Parent)',
      text: replyText.trim(),
      timestamp: 'Just now'
    };

    setMessages([...messages, newMsg]);
    setReplyText('');
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
      {/* Chat Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
            PN
          </div>
          <div>
            <h4 className="font-bold text-sm">Priya Nair (Class Teacher)</h4>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Online • NextGen Navigator School
            </span>
          </div>
        </div>

        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-300 font-mono">
          Grade 5 - Section A
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map(m => {
          const isMe = m.sender === 'parent';
          return (
            <div 
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[11px] font-semibold text-slate-400 mb-1 px-1">{m.senderName}</span>
              <div 
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-xs' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">{m.timestamp}</span>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input 
          type="text"
          placeholder="Type an instant message to class teacher..."
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
