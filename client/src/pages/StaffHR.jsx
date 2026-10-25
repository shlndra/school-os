import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Calendar, Check, X, Search, Phone, Mail, 
  Briefcase, IndianRupee, Filter, FileText, AlertCircle, CheckCircle2, 
  XCircle, Clock, Building2, Sparkles, Eye, UserCheck, ShieldCheck
} from 'lucide-react';

export default function StaffHR({ initialParams = {} }) {
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'leaves' | 'substitutes' | 'departments'
  const [searchQuery, setSearchQuery] = useState(initialParams?.staffId || '');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [leaveFilter, setLeaveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  useEffect(() => {
    if (initialParams?.staffId) {
      setSearchQuery(initialParams.staffId);
      setActiveTab('directory');
    }
  }, [initialParams?.staffId]);

  // Modals
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Form states
  const [onboardForm, setOnboardForm] = useState({
    firstName: '',
    lastName: '',
    role: 'Teacher',
    department: 'Academics',
    subject: '',
    phone: '',
    email: '',
    baseSalary: '50000',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const [leaveForm, setLeaveForm] = useState({
    staffId: '',
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
    substituteId: ''
  });

  const [subForm, setSubForm] = useState({
    originalTeacherId: '',
    substituteTeacherId: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    periodNumber: 1,
    grade: 'Grade 5',
    section: 'A',
    notes: 'Covering regular curriculum topics during faculty absence.'
  });

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffRes, statsRes, leavesRes, subsRes] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/staff/stats').then(r => r.json()),
        fetch('/api/staff/leaves').then(r => r.json()),
        fetch('/api/staff/substitutes').then(r => r.json())
      ]);

      setStaff(Array.isArray(staffRes) ? staffRes : []);
      setStats(statsRes || null);
      setLeaves(Array.isArray(leavesRes) ? leavesRes : []);
      setSubstitutes(Array.isArray(subsRes) ? subsRes : []);
    } catch (err) {
      console.error('Error fetching HR data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const triggerToast = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  // Onboard New Staff
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowOnboardModal(false);
        setOnboardForm({
          firstName: '',
          lastName: '',
          role: 'Teacher',
          department: 'Academics',
          subject: '',
          phone: '',
          email: '',
          baseSalary: '50000',
          joinDate: new Date().toISOString().split('T')[0]
        });
        triggerToast(`🎉 Successfully onboarded ${data.staff?.name || 'new staff member'}!`);
        fetchStaffData();
      } else {
        alert(data.error || 'Failed to onboard staff');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Leave Application
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowLeaveModal(false);
        setLeaveForm({
          staffId: '',
          leaveType: 'CASUAL',
          startDate: '',
          endDate: '',
          reason: '',
          substituteId: ''
        });
        triggerToast('📋 Leave application submitted to Principal for review.');
        fetchStaffData();
      } else {
        alert(data.error || 'Failed to submit leave');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Approve Leave
  const handleApproveLeave = async (id, staffName) => {
    try {
      const res = await fetch(`/api/staff/leave/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'Principal Meera Iyer' })
      });
      if (res.ok) {
        triggerToast(`✅ Leave approved for ${staffName}.`);
        fetchStaffData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Reject Leave
  const handleRejectLeave = async (id, staffName) => {
    if (!window.confirm(`Are you sure you want to decline leave request for ${staffName}?`)) return;
    try {
      const res = await fetch(`/api/staff/leave/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        triggerToast(`❌ Leave request declined for ${staffName}.`);
        fetchStaffData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Assign Substitute Teacher
  const handleSubstituteSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/substitute/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowSubModal(false);
        triggerToast('✓ Substitute teacher assigned and schedule roster updated!');
        fetchStaffData();
      } else {
        alert(data.error || 'Failed to assign substitute');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Helper for Department Colors
  const getDeptBadge = (dept) => {
    const map = {
      Academics: 'bg-blue-50 text-blue-700 border-blue-200',
      Administration: 'bg-purple-50 text-purple-700 border-purple-200',
      Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Transport: 'bg-amber-50 text-amber-700 border-amber-200',
      Security: 'bg-slate-100 text-slate-700 border-slate-300',
      Library: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Health: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return map[dept] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Department Avatar Initials background
  const getAvatarBg = (dept) => {
    const map = {
      Academics: 'bg-blue-600',
      Administration: 'bg-purple-600',
      Finance: 'bg-emerald-600',
      Transport: 'bg-amber-600',
      Security: 'bg-slate-700',
      Library: 'bg-indigo-600',
      Health: 'bg-rose-600'
    };
    return map[dept] || 'bg-slate-600';
  };

  // Filtered staff list
  const filteredStaff = staff.filter(s => {
    const fullName = s.name || `${s.first_name} ${s.last_name || ''}`;
    const matchesSearch = 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id && s.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.role && s.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery));
    
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Filtered leaves list
  const filteredLeaves = leaves.filter(l => {
    if (leaveFilter === 'ALL') return true;
    return l.status === leaveFilter;
  });

  const pendingLeavesCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Toast */}
      {actionSuccess && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={20} />
            <span className="font-medium text-sm">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-100 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" /> Staff & Human Resources
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Faculty directory, department roster, and leave approval workflows • Gurugram Campus
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors shadow-sm"
          >
            <Calendar size={16} className="mr-2 text-blue-600" /> Apply for Leave
          </button>
          <button 
            onClick={() => setShowOnboardModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center transition-colors shadow-sm"
          >
            <UserPlus size={16} className="mr-2" /> + Onboard Staff
          </button>
        </div>
      </div>

      {/* HR Pulse Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
            <Users size={14} className="text-blue-600" /> Total Staff
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.totalStaff ?? staff.length}</div>
          <div className="text-xs text-slate-400 mt-1">Active on campus</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
            <Briefcase size={14} className="text-indigo-600" /> Faculty Teachers
          </div>
          <div className="text-2xl font-bold text-indigo-700">{stats?.teachersCount ?? 5}</div>
          <div className="text-xs text-slate-400 mt-1">Academics & STEM</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
            <Building2 size={14} className="text-purple-600" /> Admin & Support
          </div>
          <div className="text-2xl font-bold text-purple-700">{stats?.supportCount ?? 7}</div>
          <div className="text-xs text-slate-400 mt-1">Ops, Transport, Security</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-amber-600" /> Pending Leaves
          </div>
          <div className="text-2xl font-bold text-amber-700 flex items-center gap-2">
            {pendingLeavesCount}
            {pendingLeavesCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <div className="text-xs text-amber-700 mt-1">Awaiting principal approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
            <IndianRupee size={14} className="text-emerald-600" /> Monthly Payroll
          </div>
          <div className="text-xl font-bold text-emerald-700">
            ₹{(stats?.totalPayrollBudget || 517000).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Direct base compensation</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'directory'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} /> Staff Directory ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'leaves'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={16} /> Leave Approvals & Queue
          {pendingLeavesCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.2 rounded-full font-bold">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('substitutes')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'substitutes'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck size={16} /> Substitute Management ({substitutes.length})
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'departments'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} /> Department Breakdown
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Department Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, ID, role, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {['ALL', 'Academics', 'Administration', 'Finance', 'Transport', 'Security', 'Health', 'Library'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    deptFilter === dept
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept === 'ALL' ? 'All Departments' : dept}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Staff Member & ID
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Designation & Specialization
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Monthly Salary
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredStaff.map((s) => {
                    const fullName = s.name || `${s.first_name} ${s.last_name || ''}`;
                    const initials = `${s.first_name ? s.first_name[0] : ''}${s.last_name ? s.last_name[0] : ''}` || 'ST';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        {/* Name & Avatar */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs ${getAvatarBg(s.department)}`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">{fullName}</div>
                              <div className="text-xs font-mono text-slate-400">{s.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Designation / Role */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-800">{s.role}</div>
                          <div className="text-xs text-slate-500">
                            {s.subject ? `Spec: ${s.subject}` : `Campus Staff`}
                          </div>
                        </td>

                        {/* Department Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDeptBadge(s.department)}`}>
                            {s.department || 'General'}
                          </span>
                        </td>

                        {/* Contact info */}
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600">
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone size={12} className="text-slate-400" /> +91 {s.phone}
                            </div>
                          )}
                          {s.email ? (
                            <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                              <Mail size={12} className="text-slate-400" /> {s.email}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No email registered</span>
                          )}
                        </td>

                        {/* Monthly Salary */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            ₹{(s.base_salary || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-400">per month</div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'ACTIVE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : s.status === 'ON_LEAVE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {s.status === 'ACTIVE' ? 'Active' : s.status === 'ON_LEAVE' ? 'On Leave' : s.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                          <button
                            onClick={() => setSelectedStaff(s)}
                            className="text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye size={13} /> View Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        <Users size={36} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-medium text-slate-600">No staff members found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or department filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE APPLICATIONS & APPROVALS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {/* Subfilter pills */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Filter by Status:</span>
              {[
                { key: 'ALL', label: 'All Requests' },
                { key: 'PENDING', label: `Pending Approval (${pendingLeavesCount})` },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'REJECTED', label: 'Declined' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setLeaveFilter(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    leaveFilter === tab.key
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLeaveModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium flex items-center transition-colors"
            >
              <Calendar size={14} className="mr-1.5" /> + New Leave Application
            </button>
          </div>

          {/* Leaves Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Leave Category
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Duration & Dates
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reason Stated
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Approval Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Principal Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeaves.map((l) => {
                  const staffName = l.staff_name || `${l.first_name} ${l.last_name || ''}`;
                  const start = new Date(l.start_date);
                  const end = new Date(l.end_date);
                  const diffTime = Math.abs(end - start);
                  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-sm">{staffName}</div>
                        <div className="text-xs text-slate-500">{l.role} • {l.department}</div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          l.leave_type === 'SICK'
                            ? 'bg-rose-100 text-rose-800'
                            : l.leave_type === 'CASUAL'
                            ? 'bg-amber-100 text-amber-800'
                            : l.leave_type === 'EARNED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {l.leave_type} LEAVE
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700">
                        <div className="font-medium text-slate-900">{l.start_date} to {l.end_date}</div>
                        <div className="text-slate-400 mt-0.5">{isNaN(days) ? '1' : days} day(s) duration</div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                        <p className="truncate" title={l.reason}>{l.reason || 'Personal matters'}</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {l.status === 'APPROVED' && <CheckCircle2 size={12} className="mr-1 text-emerald-600" />}
                          {l.status === 'PENDING' && <Clock size={12} className="mr-1 text-amber-600" />}
                          {l.status === 'REJECTED' && <XCircle size={12} className="mr-1 text-rose-600" />}
                          {l.status}
                        </span>
                        {l.approved_by && (
                          <div className="text-[11px] text-slate-400 mt-0.5">By {l.approved_by}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs">
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApproveLeave(l.id, staffName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-medium flex items-center transition-colors"
                            >
                              <Check size={13} className="mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectLeave(l.id, staffName)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded text-xs font-medium flex items-center transition-colors"
                            >
                              <X size={13} className="mr-1" /> Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No leave applications found</p>
                      <p className="text-xs text-slate-400 mt-1">Staff leave requests will appear here for administrative approval</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSTITUTE TEACHER ASSIGNMENTS */}
      {activeTab === 'substitutes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Substitute Faculty Deployments</h3>
              <p className="text-xs text-slate-500">
                Ensure zero unattended periods during faculty casual or medical leaves
              </p>
            </div>

            <button
              onClick={() => {
                if (staff.length > 1) {
                  setSubForm(prev => ({
                    ...prev,
                    originalTeacherId: staff[0].id,
                    substituteTeacherId: staff[1].id
                  }));
                }
                setShowSubModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
            >
              <UserCheck size={14} className="mr-1.5" /> + Assign Substitute
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Absent / On-Leave Faculty
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Assigned Substitute
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date & Period
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Class / Section
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Handover Notes
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Coverage Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {substitutes.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-sm">{sub.original_teacher_name}</div>
                      <div className="text-xs text-slate-500">Subject: {sub.original_subject || 'Academics'}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-blue-700 text-sm flex items-center gap-1.5">
                        <UserCheck size={14} />
                        <span>{sub.substitute_teacher_name}</span>
                      </div>
                      <div className="text-xs text-slate-500">{sub.substitute_role || 'Faculty'}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">{sub.assignment_date}</div>
                      <div className="text-[11px] text-blue-600 font-bold font-mono">Period {sub.period_number}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs">
                        {sub.grade} - {sub.section}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                      {sub.notes || 'Curriculum coverage'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={12} className="mr-1" />
                        {sub.status || 'ASSIGNED'}
                      </span>
                    </td>
                  </tr>
                ))}

                {substitutes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <UserCheck size={36} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No active substitute teacher assignments</p>
                      <p className="text-xs text-slate-400 mt-1">Assign a faculty member to cover classes for colleagues on leave</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENTS BREAKDOWN */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: 'Academics', icon: Briefcase, color: 'border-blue-500', desc: 'Class teachers, Subject matter specialists, STEM faculty' },
            { name: 'Administration', icon: Building2, color: 'border-purple-500', desc: 'Principal office, admissions team, campus registrar' },
            { name: 'Finance', icon: IndianRupee, color: 'border-emerald-500', desc: 'School accountant, fee collections, ledger & payroll audits' },
            { name: 'Transport', icon: Users, color: 'border-amber-500', desc: 'Bus drivers, route fleet coordinators, student escorts' },
            { name: 'Security', icon: ShieldCheck, color: 'border-slate-600', desc: 'Campus security gate, CCTV monitoring, student safety' },
            { name: 'Health & Wellness', icon: Sparkles, color: 'border-rose-500', desc: 'Campus infirmary, medical nurse, student first-aid' },
            { name: 'Library', icon: FileText, color: 'border-indigo-500', desc: 'Librarian, textbook inventory, reading room management' },
          ].map(dept => {
            const deptStaff = staff.filter(s => s.department === (dept.name === 'Health & Wellness' ? 'Health' : dept.name));
            const totalMonthly = deptStaff.reduce((acc, curr) => acc + (curr.base_salary || 0), 0);
            const DeptIcon = dept.icon;
            return (
              <div key={dept.name} className={`bg-white rounded-xl p-5 border-l-4 ${dept.color} shadow-sm border-t border-r border-b border-slate-200`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      <DeptIcon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{dept.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                    {deptStaff.length} Staff
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Monthly Compensation:</span>
                  <span className="font-semibold text-slate-800">₹{totalMonthly.toLocaleString('en-IN')}</span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {deptStaff.slice(0, 3).map(s => (
                    <div key={s.id} className="text-xs flex items-center justify-between text-slate-600 py-1 border-b border-slate-50">
                      <span className="font-medium text-slate-800">{s.name || `${s.first_name} ${s.last_name}`}</span>
                      <span className="text-slate-400">{s.role}</span>
                    </div>
                  ))}
                  {deptStaff.length > 3 && (
                    <div className="text-[11px] text-blue-600 font-medium pt-1">
                      + {deptStaff.length - 3} more members
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ONBOARD NEW STAFF */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Onboard New Faculty / Staff</h3>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Shalini"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.firstName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Verma"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.lastName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.role}
                    onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Driver">Driver</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Librarian">Librarian</option>
                    <option value="Guard">Guard</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Principal">Principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.department}
                    onChange={(e) => setOnboardForm({ ...onboardForm, department: e.target.value })}
                  >
                    <option value="Academics">Academics</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance">Finance</option>
                    <option value="Transport">Transport</option>
                    <option value="Security">Security</option>
                    <option value="Health">Health</option>
                    <option value="Library">Library</option>
                  </select>
                </div>
              </div>

              {onboardForm.role === 'Teacher' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teaching Subject Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics / Mathematics / English"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.subject}
                    onChange={(e) => setOnboardForm({ ...onboardForm, subject: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (+91)</label>
                  <input
                    type="tel"
                    placeholder="98765 00014"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="name@school.edu"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Base Salary (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                    <input
                      required
                      type="number"
                      min="1000"
                      step="500"
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      value={onboardForm.baseSalary}
                      onChange={(e) => setOnboardForm({ ...onboardForm, baseSalary: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={onboardForm.joinDate}
                    onChange={(e) => setOnboardForm({ ...onboardForm, joinDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={16} /> Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLY FOR LEAVE */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">New Staff Leave Application</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Staff Member *</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={leaveForm.staffId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                >
                  <option value="">-- Choose employee --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || `${s.first_name} ${s.last_name}`} ({s.role} - {s.department}) [{s.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type *</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Medical / Sick Leave (SL)</option>
                  <option value="EARNED">Earned / Privilege Leave (EL)</option>
                  <option value="MATERNITY">Maternity / Paternity Leave</option>
                  <option value="UNPAID">Unpaid / Extraordinary Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detail the reason for leave request..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={16} /> Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STAFF PROFILE CARD */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md ${getAvatarBg(selectedStaff.department)}`}>
                  {selectedStaff.first_name?.[0]}{selectedStaff.last_name?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedStaff.name || `${selectedStaff.first_name} ${selectedStaff.last_name}`}
                  </h3>
                  <div className="text-xs font-mono text-slate-400">{selectedStaff.id}</div>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Designation / Role:</span>
                <span className="font-semibold text-slate-800">{selectedStaff.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Department:</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${getDeptBadge(selectedStaff.department)}`}>
                  {selectedStaff.department}
                </span>
              </div>
              {selectedStaff.subject && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Teaching Subject:</span>
                  <span className="font-semibold text-slate-800">{selectedStaff.subject}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Mobile Phone:</span>
                <span className="font-semibold text-slate-800">+91 {selectedStaff.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Official Email:</span>
                <span className="font-semibold text-slate-800">{selectedStaff.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Joining Date:</span>
                <span className="font-semibold text-slate-800">{selectedStaff.join_date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Base Monthly Compensation:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{(selectedStaff.base_salary || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedStaff(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN SUBSTITUTE TEACHER */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserCheck className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Assign Substitute Faculty</h3>
              </div>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubstituteSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Absent Teacher *</label>
                  <select
                    required
                    value={subForm.originalTeacherId}
                    onChange={(e) => setSubForm({ ...subForm, originalTeacherId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Substitute Faculty *</label>
                  <select
                    required
                    value={subForm.substituteTeacherId}
                    onChange={(e) => setSubForm({ ...subForm, substituteTeacherId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Substitute...</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={subForm.assignmentDate}
                    onChange={(e) => setSubForm({ ...subForm, assignmentDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period Number</label>
                  <select
                    value={subForm.periodNumber}
                    onChange={(e) => setSubForm({ ...subForm, periodNumber: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map(p => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Section</label>
                  <select
                    value={`${subForm.grade}|${subForm.section}`}
                    onChange={(e) => {
                      const [g, sec] = e.target.value.split('|');
                      setSubForm({ ...subForm, grade: g, section: sec });
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                      <React.Fragment key={g}>
                        <option value={`Grade ${g}|A`}>Grade {g} - A</option>
                        <option value={`Grade ${g}|B`}>Grade {g} - B</option>
                      </React.Fragment>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Handover Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={subForm.notes}
                  onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                  placeholder="e.g. Conduct chapter 4 revision test and collect notebooks."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

