import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  Phone, 
  Calendar, 
  X, 
  Printer, 
  Search, 
  IdCard, 
  Sparkles, 
  Award, 
  MapPin, 
  ShieldCheck,
  Check
} from 'lucide-react';

export default function Admissions() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'id_cards'

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
              Pillar 1: Admissions & Enrollment
            </span>
            <span className="text-xs font-semibold text-slate-500">Academic Session 2026-27</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Student Onboarding & ID Studio</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Admissions Pipeline Lifecycle • Automated Scholar Onboarding • PVC Smart ID Card Issuance
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shadow-2xs gap-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'pipeline' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Admissions Pipeline (Kanban)
          </button>
          <button
            onClick={() => setActiveTab('id_cards')}
            className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'id_cards' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🪪 Student ID Card Studio
          </button>
        </div>
      </div>

      {activeTab === 'pipeline' ? <PipelineTab /> : <IdCardStudioTab />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: ADMISSIONS PIPELINE (KANBAN)
// -------------------------------------------------------------
function PipelineTab() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [newAdmission, setNewAdmission] = useState({
    applicantName: '',
    targetGrade: 'Grade 1',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    dateOfBirth: '2020-04-15'
  });

  const fetchAdmissions = () => {
    fetch('/api/admissions')
      .then(res => res.json())
      .then(data => {
        setAdmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load admissions:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newAdmission.applicantName.trim()) return;

    setSubmitting(true);
    fetch('/api/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmission)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create admission');
        return res.json();
      })
      .then(() => {
        setSubmitting(false);
        setShowForm(false);
        setSuccessMsg(`✓ Application for "${newAdmission.applicantName}" submitted to admissions queue!`);
        setNewAdmission({
          applicantName: '',
          targetGrade: 'Grade 1',
          guardianName: '',
          guardianPhone: '',
          guardianEmail: '',
          dateOfBirth: '2020-04-15'
        });
        fetchAdmissions();
        setTimeout(() => setSuccessMsg(''), 4500);
      })
      .catch(err => {
        setSubmitting(false);
        alert('Error creating admission: ' + err.message);
      });
  };

  const handleAdvance = (id, currentStatus) => {
    // Collect required extra body parameters based on stage
    let body = {};
    if (currentStatus === 'INTERVIEW_SCHEDULED') {
      body.interviewScore = 88;
      body.interviewNotes = 'Candidate demonstrated exceptional logical reasoning and reading readiness.';
    } else if (currentStatus === 'OFFER_EXTENDED') {
      body.feePaid = 45000;
    }

    fetch(`/api/admissions/${id}/advance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('✓ Application successfully advanced to next enrollment stage!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchAdmissions();
      })
      .catch(err => alert('Failed to advance: ' + err.message));
  };

  // Group columns
  const stages = [
    { key: 'ENQUIRY_RECEIVED', label: '1. Enquiry Received', color: 'border-slate-300 bg-slate-50/50' },
    { key: 'DOCUMENTS_VERIFIED', label: '2. Documents Verified', color: 'border-blue-300 bg-blue-50/30' },
    { key: 'INTERVIEW_SCHEDULED', label: '3. Assessment & Interview', color: 'border-purple-300 bg-purple-50/30' },
    { key: 'OFFER_EXTENDED', label: '4. Offer Extended', color: 'border-amber-300 bg-amber-50/30' },
    { key: 'FEES_CLEARED', label: '5. Fees Cleared', color: 'border-teal-300 bg-teal-50/30' },
    { key: 'ENROLLED', label: '6. Enrolled & Scholar Created', color: 'border-emerald-300 bg-emerald-50/30' },
  ];

  return (
    <div className="space-y-5">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Gurugram Campus Admissions Pipeline</h3>
          <p className="text-xs text-slate-500">Track applicants from initial inquiry to enrolled scholar registration</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>+ New Admission Application</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading admissions pipeline...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {stages.map(st => {
            const list = admissions.filter(a => {
              if (st.key === 'ENQUIRY_RECEIVED') return a.status === 'ENQUIRY_RECEIVED' || a.status === 'DOCUMENTS_PENDING';
              if (st.key === 'DOCUMENTS_VERIFIED') return a.status === 'DOCUMENTS_VERIFIED';
              if (st.key === 'INTERVIEW_SCHEDULED') return a.status === 'INTERVIEW_SCHEDULED' || a.status === 'EVALUATION_COMPLETE';
              if (st.key === 'OFFER_EXTENDED') return a.status === 'OFFER_EXTENDED';
              if (st.key === 'FEES_CLEARED') return a.status === 'FEES_CLEARED';
              if (st.key === 'ENROLLED') return a.status === 'ENROLLED';
              return a.status === st.key;
            });

            return (
              <div key={st.key} className={`rounded-2xl border p-3 flex flex-col min-h-[480px] ${st.color}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                  <span className="font-bold text-slate-700 text-xs">{st.label}</span>
                  <span className="bg-white border border-slate-200 text-slate-800 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {list.map(adm => {
                    const applicantName = adm.applicant_name || adm.name;
                    const grade = adm.target_grade || adm.grade;
                    const guardian = adm.guardian_name || adm.guardianName || 'Guardian';
                    const phone = adm.guardian_phone || adm.parentContact;

                    return (
                      <div key={adm.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-slate-800 text-xs leading-snug">{applicantName}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {grade}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <div>Parent: {guardian}</div>
                          {phone && <div className="font-mono text-slate-400">{phone}</div>}
                        </div>

                        {adm.status !== 'ENROLLED' && (
                          <button
                            onClick={() => handleAdvance(adm.id, adm.status)}
                            className="w-full mt-2 bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                          >
                            <span>Advance Stage</span>
                            <ArrowRight size={12} />
                          </button>
                        )}
                        {adm.status === 'ENROLLED' && (
                          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-center flex items-center justify-center gap-1">
                            <Check size={12} />
                            <span>Scholar Enrolled</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {list.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl">
                      No candidates in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Admission Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">New Student Admission Form</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryan Mehra"
                  value={newAdmission.applicantName}
                  onChange={e => setNewAdmission({ ...newAdmission, applicantName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applying for Grade</label>
                  <select
                    value={newAdmission.targetGrade}
                    onChange={e => setNewAdmission({ ...newAdmission, targetGrade: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                      <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newAdmission.dateOfBirth}
                    onChange={e => setNewAdmission({ ...newAdmission, dateOfBirth: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajiv Mehra"
                  value={newAdmission.guardianName}
                  onChange={e => setNewAdmission({ ...newAdmission, guardianName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98100 00000"
                    value={newAdmission.guardianPhone}
                    onChange={e => setNewAdmission({ ...newAdmission, guardianPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={newAdmission.guardianEmail}
                    onChange={e => setNewAdmission({ ...newAdmission, guardianEmail: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register Applicant'}
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
// TAB 2: STUDENT ID CARD STUDIO (PVC CARD LIVE GENERATOR)
// -------------------------------------------------------------
function IdCardStudioTab() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        if (list.length > 0) setSelectedStudent(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filtered = students.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || 
           (s.id && s.id.toLowerCase().includes(search.toLowerCase())) ||
           (s.grade && s.grade.toLowerCase().includes(search.toLowerCase()));
  });

  if (loading) {
    return <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">Loading student profiles...</div>;
  }

  const studentName = selectedStudent ? `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim() : 'Student';

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by student name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-52 sm:w-64"
            />
          </div>

          <select
            value={selectedStudent?.id || ''}
            onChange={e => {
              const found = students.find(s => s.id === e.target.value);
              if (found) setSelectedStudent(found);
            }}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs max-w-[280px]"
          >
            {filtered.map(s => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.grade} - {s.section || 'A'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Printer size={16} />
          <span>Print Official PVC Card</span>
        </button>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Card Preview Front */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Identity Card Front (CR-80 Standard PVC)
            </span>

            <div className="w-full max-w-sm mx-auto bg-linear-to-b from-blue-900 via-indigo-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border-2 border-slate-700/60 relative overflow-hidden">
              {/* Pattern Background Accent */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>

              {/* Institution Title */}
              <div className="text-center border-b border-white/15 pb-3">
                <div className="text-[10px] font-bold tracking-widest uppercase text-blue-300">
                  NEXTGEN NAVIGATOR SCHOOL
                </div>
                <div className="text-[9px] text-slate-300">Sector 48, Sohna Road, Gurugram NCR</div>
              </div>

              {/* Student Identity Section */}
              <div className="mt-5 flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-tr from-amber-400 to-yellow-200 border-4 border-white/90 shadow-md flex items-center justify-center font-black text-3xl text-slate-900 mb-3">
                  {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                </div>
                <h3 className="font-extrabold text-lg text-white tracking-wide text-center">
                  {studentName}
                </h3>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 mt-1">
                  {selectedStudent.grade} - Section {selectedStudent.section || 'A'}
                </span>
              </div>

              {/* Meta Grid */}
              <div className="mt-5 grid grid-cols-2 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl text-[11px] border border-white/10">
                <div>
                  <span className="text-blue-300 block text-[9px] uppercase tracking-wider">Scholar ID</span>
                  <span className="font-mono font-bold text-white">{selectedStudent.id}</span>
                </div>
                <div>
                  <span className="text-blue-300 block text-[9px] uppercase tracking-wider">Blood Group</span>
                  <span className="font-bold text-red-300">{selectedStudent.blood_group || 'B+'}</span>
                </div>
                <div>
                  <span className="text-blue-300 block text-[9px] uppercase tracking-wider">Date of Birth</span>
                  <span className="font-bold text-white">{selectedStudent.date_of_birth || '15/04/2014'}</span>
                </div>
                <div>
                  <span className="text-blue-300 block text-[9px] uppercase tracking-wider">Emergency Contact</span>
                  <span className="font-mono font-bold text-white">{selectedStudent.emergency_contact || '+91 98110 12345'}</span>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="mt-5 text-center pt-2 border-t border-white/15">
                <div className="font-mono tracking-widest text-[9px] text-slate-400">
                  |||||| | |||||||| || |||||| | |||||||||
                </div>
                <span className="text-[8px] text-slate-400 font-mono">AUTH-{selectedStudent.id}-2026</span>
              </div>
            </div>
          </div>

          {/* Card Preview Back */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Identity Card Back (Instructions & RFID Signature)
            </span>

            <div className="w-full max-w-sm mx-auto bg-white text-slate-800 rounded-3xl p-6 shadow-xl border-2 border-slate-200 relative overflow-hidden flex flex-col justify-between h-[450px]">
              <div>
                <div className="text-center pb-3 border-b border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block">TERMS OF SMART CAMPUS PASS</span>
                  <span className="text-[10px] text-slate-500">Property of NextGen Navigator School Gurugram</span>
                </div>

                <div className="mt-4 space-y-2 text-[10px] text-slate-600 leading-relaxed">
                  <p>1. This card must be presented at campus entrance turnstiles, school buses, and library checkouts.</p>
                  <p>2. Loss of card must be reported immediately to the School Registrar Office (+91 124 4567890).</p>
                  <p>3. Cafeteria and campus store purchases are authenticated via smart wallet embedded chip.</p>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1">
                  <div className="font-bold text-slate-800">Campus Address:</div>
                  <div className="text-slate-500">Sector 48, Sohna Road, Gurugram, Haryana - 122018</div>
                  <div className="text-slate-500">Emergency Clinic Line: +91 98112 00911</div>
                </div>
              </div>

              <div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <div>
                    <div className="font-mono text-slate-400 text-[9px]">RFID: CHIP-ENC-2026</div>
                    <span className="font-bold text-slate-600">Valid Till: Mar 2027</span>
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic font-bold text-blue-900 text-sm">Dr. Anita Roy</div>
                    <span className="text-[9px] text-slate-400 font-bold block">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
