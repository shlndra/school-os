import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Upload, 
  Send, 
  Award, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet,
  GraduationCap,
  Printer,
  Search,
  BookOpen,
  MapPin,
  UserCheck,
  Edit3,
  Sparkles
} from 'lucide-react';

export default function Classroom({ initialParams = {} }) {
  const [activeTab, setActiveTab] = useState(initialParams?.studentId ? 'report_card' : 'attendance');

  useEffect(() => {
    if (initialParams?.studentId) {
      setActiveTab('report_card');
    }
  }, [initialParams?.studentId]);
  
  return (
    <div className="space-y-6 pb-8">
      {/* Page Title & Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
              Pillar 2: Academics
            </span>
            <span className="text-xs font-semibold text-slate-500">CBSE Curriculum Framework</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Academics & Classroom Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Timetable Management • Attendance Tracking (&lt;90s) • Exams & CBSE Official Report Cards
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-2xs gap-1">
          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('attendance')}
          >
            <Clock size={15} />
            <span>Attendance (Roll Call)</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'timetable' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('timetable')}
          >
            <Calendar size={15} />
            <span>Weekly Timetable</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'marks' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('marks')}
          >
            <Award size={15} />
            <span>Exams & Marks Entry</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'report_card' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('report_card')}
          >
            <GraduationCap size={15} />
            <span>CBSE Report Cards</span>
          </button>
        </div>
      </div>
      
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'timetable' && <TimetableTab />}
      {activeTab === 'marks' && <MarksTab />}
      {activeTab === 'report_card' && <ReportCardTab initialStudentId={initialParams?.studentId} />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: ATTENDANCE (Roll Call - 90s speed protocol)
// -------------------------------------------------------------
function AttendanceTab() {
  const [grade, setGrade] = useState('Grade 5');
  const [section, setSection] = useState('A');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    let interval = setInterval(() => {
      if (startTime) {
        setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const fetchAttendance = (targetGrade = grade, targetSection = section, targetDate = date) => {
    setLoading(true);
    setStartTime(Date.now());
    
    fetch(`/api/attendance/${encodeURIComponent(targetGrade)}/${encodeURIComponent(targetSection)}/${encodeURIComponent(targetDate)}`)
      .then(res => res.json())
      .then(data => {
        let records = [];
        if (data && Array.isArray(data.records)) {
          records = data.records;
        } else if (Array.isArray(data)) {
          records = data;
        }

        if (records.length === 0) {
          fetch(`/api/students?grade=${encodeURIComponent(targetGrade)}&section=${encodeURIComponent(targetSection)}`)
            .then(res => res.json())
            .then(studentList => {
              const mapped = (Array.isArray(studentList) ? studentList : []).map(s => ({
                studentId: s.id,
                name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                status: 'Present'
              }));
              setStudents(mapped);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          const normalized = records.map(r => ({
            studentId: r.studentId || r.id,
            name: r.name,
            status: r.status === 'Absent' ? 'Absent' : 'Present'
          }));
          setStudents(normalized);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching attendance:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleGradeChange = (newGrade) => {
    setGrade(newGrade);
    fetchAttendance(newGrade, section, date);
  };

  const handleSectionChange = (newSec) => {
    setSection(newSec);
    fetchAttendance(grade, newSec, date);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    fetchAttendance(grade, section, newDate);
  };

  const toggleStatus = (index) => {
    const updated = [...students];
    updated[index].status = updated[index].status === 'Present' ? 'Absent' : 'Present';
    setStudents(updated);
  };

  const markAllPresent = () => {
    setStudents(students.map(s => ({ ...s, status: 'Present' })));
  };

  const submitAttendance = () => {
    if (students.length === 0) return alert('No students to submit attendance for.');
    
    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date, 
        grade, 
        section, 
        records: students.map(s => ({ studentId: s.studentId, status: s.status.toUpperCase() }))
      })
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg(`✓ Attendance for ${grade} - Section ${section} saved in ${elapsedSec}s!`);
        setTimeout(() => setSuccessMsg(''), 4500);
      })
      .catch(err => alert('Failed to save attendance: ' + err.message));
  };

  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;

  return (
    <div className="space-y-5">
      {/* 90-Second Invariant Header Notice */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600 flex-shrink-0" />
          <span>
            <strong>90-Second Fast Roll Call Protocol:</strong> All students default to <strong>Present</strong>. Simply tap absent students to flip them to red and hit submit.
          </span>
        </div>
        <div className="font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg whitespace-nowrap hidden sm:block">
          Timer: {elapsedSec}s {elapsedSec <= 90 ? '⚡ On Target' : '⚠️ >90s'}
        </div>
      </div>

      {/* Filter and Class Selection Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Class / Grade</label>
            <select 
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-36"
              value={grade}
              onChange={e => handleGradeChange(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Section</label>
            <select 
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-28"
              value={section}
              onChange={e => handleSectionChange(e.target.value)}
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Date</label>
            <input 
              type="date" 
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs" 
              value={date} 
              onChange={e => handleDateChange(e.target.value)} 
            />
          </div>

          <button 
            onClick={() => fetchAttendance(grade, section, date)} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Refresh List
          </button>
        </div>

        {/* Quick Actions & Counter */}
        {students.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">{students.length} Total</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-700">{presentCount} Present</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-red-600">{absentCount} Absent</span>
            </div>

            <button
              onClick={markAllPresent}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              All Present
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Attendance Roster Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading student roster for {grade} - Section {section}...
        </div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/70 p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800 text-sm">
                Roster: {grade} - Section {section} ({date})
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tap button to toggle between Present / Absent
              </span>
            </div>

            <button 
              onClick={submitAttendance} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Upload size={16} /> 
              <span>Submit & Lock Attendance</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Roll #</th>
                  <th className="px-6 py-3 text-left">Student Name</th>
                  <th className="px-6 py-3 text-left">Student ID</th>
                  <th className="px-6 py-3 text-right">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const isPresent = student.status === 'Present';
                  return (
                    <tr key={student.studentId || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 text-sm">
                        {student.name}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <button 
                          onClick={() => toggleStatus(idx)}
                          className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                            isPresent 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <Check size={14} className="mr-1.5 text-emerald-700 stroke-[3]" />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <X size={14} className="mr-1.5 text-red-700 stroke-[3]" />
                              <span>Absent</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
          No students enrolled in {grade} - Section {section}. Select another class above.
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: WEEKLY TIMETABLE MANAGEMENT
// -------------------------------------------------------------
function TimetableTab() {
  const [grade, setGrade] = useState('Grade 5');
  const [section, setSection] = useState('A');
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];
  const timeSlots = [
    { p: 1, start: '08:00', end: '08:45' },
    { p: 2, start: '08:45', end: '09:30' },
    { p: 3, start: '09:45', end: '10:30' }, // after recess
    { p: 4, start: '10:30', end: '11:15' },
    { p: 5, start: '11:45', end: '12:30' }, // after lunch
    { p: 6, start: '12:30', end: '01:15' },
  ];

  const fetchTimetable = (g = grade, s = section) => {
    setLoading(true);
    fetch(`/api/timetable/${encodeURIComponent(g)}/${encodeURIComponent(s)}`)
      .then(res => res.json())
      .then(data => {
        setTimetable(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTimetable(grade, section);
    // fetch staff list for dropdown
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => setStaffList(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [grade, section]);

  const getSlot = (day, pNum) => {
    return timetable.find(t => t.day_of_week === day && t.period_number === pNum);
  };

  const handleEditSlot = (day, pNum) => {
    const slot = getSlot(day, pNum);
    const timeRef = timeSlots.find(ts => ts.p === pNum);
    setEditingSlot({
      grade,
      section,
      dayOfWeek: day,
      periodNumber: pNum,
      subject: slot?.subject || 'General Studies',
      teacherId: slot?.teacher_id || (staffList[0]?.id || ''),
      roomNumber: slot?.room_number || `Room ${grade.replace('Grade ', '')}01`,
      startTime: slot?.start_time || timeRef?.start || '08:00',
      endTime: slot?.end_time || timeRef?.end || '08:45'
    });
    setModalOpen(true);
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    fetch('/api/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingSlot)
    })
      .then(res => res.json())
      .then(() => {
        setModalOpen(false);
        setNotification(`✓ Schedule updated for ${editingSlot.dayOfWeek} Period ${editingSlot.periodNumber}!`);
        setTimeout(() => setNotification(''), 4000);
        fetchTimetable(grade, section);
      })
      .catch(err => alert('Failed to update slot: ' + err.message));
  };

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Select Class</label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-36"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Section</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-28"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          <div className="pt-5">
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium">
              Academic Term 2026-27 • 6 Periods Daily
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles size={13} />
            <span>Interactive Timetable Matrix</span>
          </span>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Weekly Master Timetable: {grade} - Section {section}
            </h3>
          </div>
          <span className="text-xs text-slate-500">Click any period to edit subject or teacher</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-3 text-left border-r border-slate-200 w-28">Day / Time</th>
                {timeSlots.map(ts => (
                  <th key={ts.p} className="p-3 text-center border-r border-slate-200">
                    <div>Period {ts.p}</div>
                    <div className="text-[10px] text-slate-400 font-normal font-mono">{ts.start} - {ts.end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map(day => (
                <tr key={day} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800 text-xs border-r border-slate-200 bg-slate-50/40 whitespace-nowrap">
                    {day}
                  </td>
                  {periods.map(pNum => {
                    const slot = getSlot(day, pNum);
                    return (
                      <td 
                        key={pNum} 
                        onClick={() => handleEditSlot(day, pNum)}
                        className="p-2 border-r border-slate-200 align-top cursor-pointer group hover:bg-blue-50/60 transition-colors"
                      >
                        {slot ? (
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:border-blue-300 transition-all shadow-2xs h-full flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-xs text-blue-900 group-hover:text-blue-600 line-clamp-1">
                                {slot.subject}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                                <UserCheck size={11} className="text-slate-400" />
                                <span className="line-clamp-1">{slot.teacher_name || 'Assigned Staff'}</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <MapPin size={10} />
                                {slot.room_number || 'Room 101'}
                              </span>
                              <Edit3 size={11} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 hover:text-blue-600 hover:border-blue-300">
                            + Add Period
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slot Modal */}
      {modalOpen && editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Edit Timetable Period</h3>
                <p className="text-xs text-slate-500">
                  {editingSlot.dayOfWeek} • Period {editingSlot.periodNumber} ({editingSlot.grade} - {editingSlot.section})
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input 
                  type="text"
                  required
                  value={editingSlot.subject}
                  onChange={e => setEditingSlot({ ...editingSlot, subject: e.target.value })}
                  placeholder="e.g. Mathematics, English, General Science"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty / Teacher</label>
                <select
                  value={editingSlot.teacherId}
                  onChange={e => setEditingSlot({ ...editingSlot, teacherId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Faculty...</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.role || s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input 
                    type="time"
                    value={editingSlot.startTime}
                    onChange={e => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input 
                    type="time"
                    value={editingSlot.endTime}
                    onChange={e => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room / Lab Number</label>
                <input 
                  type="text"
                  value={editingSlot.roomNumber}
                  onChange={e => setEditingSlot({ ...editingSlot, roomNumber: e.target.value })}
                  placeholder="e.g. Room 204 or Physics Lab"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Save Timetable Slot
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
// TAB 3: EXAMS & MARKS ENTRY
// -------------------------------------------------------------
function MarksTab() {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/assessments')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAssessments(list);
        if (list.length > 0) {
          loadAssessment(list[0]);
        }
      })
      .catch(console.error);
  }, []);

  const loadAssessment = (assm) => {
    setSelectedAssessment(assm);
    setLoading(true);
    fetch(`/api/assessments/${assm.id}/marks`)
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data && Array.isArray(data.marks)) {
          setMarks(data.marks);
        } else if (Array.isArray(data)) {
          setMarks(data);
        } else {
          setMarks([]);
        }
      })
      .catch(() => setLoading(false));
  };

  const submitMarks = () => {
    if (!selectedAssessment) return;
    
    for (const m of marks) {
      if (m.mark < 0 || m.mark > selectedAssessment.maxMarks) {
        return alert(`Score for ${m.name} (${m.mark}) cannot exceed ${selectedAssessment.maxMarks} marks!`);
      }
    }

    fetch(`/api/assessments/${selectedAssessment.id}/marks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks })
    })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('✓ Student marks saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      })
      .catch(err => alert('Failed to save marks: ' + err.message));
  };

  const publishAssessment = () => {
    if (!selectedAssessment) return;
    fetch(`/api/assessments/${selectedAssessment.id}/publish`, { method: 'PATCH' })
      .then(res => res.json())
      .then(() => {
        setSuccessMsg('✓ Assessment published! Report cards are now accessible to guardians.');
        setSelectedAssessment({ ...selectedAssessment, status: 'PUBLISHED' });
        setTimeout(() => setSuccessMsg(''), 5000);
      })
      .catch(err => alert('Failed to publish: ' + err.message));
  };

  const getGradeLetter = (score, max) => {
    if (!max || score === undefined) return { letter: '-', color: 'text-slate-500 bg-slate-50' };
    const pct = (score / max) * 100;
    if (pct >= 90) return { letter: 'A1', color: 'text-emerald-700 bg-emerald-50' };
    if (pct >= 80) return { letter: 'A2', color: 'text-blue-700 bg-blue-50' };
    if (pct >= 70) return { letter: 'B1', color: 'text-indigo-700 bg-indigo-50' };
    if (pct >= 60) return { letter: 'B2', color: 'text-purple-700 bg-purple-50' };
    if (pct >= 40) return { letter: 'C1', color: 'text-amber-700 bg-amber-50' };
    return { letter: 'D', color: 'text-red-700 bg-red-50' };
  };

  return (
    <div className="space-y-5">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Assessments List */}
        <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50/70 p-4 border-b border-slate-100 font-bold text-slate-800 text-sm flex justify-between items-center">
            <span>Academic Examinations</span>
            <span className="text-xs text-slate-500 font-normal">{assessments.length} exams</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {assessments.map(assm => {
              const isSelected = selectedAssessment?.id === assm.id;
              return (
                <div 
                  key={assm.id} 
                  onClick={() => loadAssessment(assm)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/70 border-l-4 border-blue-600 shadow-2xs' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-base">{assm.name || assm.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      assm.status === 'PUBLISHED' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {assm.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="font-semibold text-blue-600">{assm.subject}</span>
                    <span>•</span>
                    <span>{assm.grade} - Section {assm.section || 'A'}</span>
                    <span>•</span>
                    <span>Max: {assm.maxMarks} Marks</span>
                  </div>
                </div>
              );
            })}
            {assessments.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No assessments scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Marks Entry & Grade Book */}
        <div className="w-full lg:w-2/3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {selectedAssessment ? (
            <>
              {/* Exam Info & Action Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg">{selectedAssessment.name || selectedAssessment.title}</h3>
                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Max: {selectedAssessment.maxMarks}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAssessment.grade} - Section {selectedAssessment.section || 'A'} • {selectedAssessment.subject}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={submitMarks} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Upload size={14} /> 
                    <span>Save Marks</span>
                  </button>
                  <button 
                    onClick={publishAssessment} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Send size={14} /> 
                    <span>Publish Reports</span>
                  </button>
                </div>
              </div>

              {/* Marks Table */}
              <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Roll #</th>
                      <th className="px-6 py-3 text-left">Student Name</th>
                      <th className="px-6 py-3 text-center">Score (Max: {selectedAssessment.maxMarks})</th>
                      <th className="px-6 py-3 text-right">Percentage & Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {marks.map((m, idx) => {
                      const gradeObj = getGradeLetter(m.mark, selectedAssessment.maxMarks);
                      const pct = Math.round((m.mark / selectedAssessment.maxMarks) * 100);

                      return (
                        <tr key={m.studentId || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap font-bold text-slate-800 text-sm">
                            {m.name}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-center">
                            <input 
                              type="number" 
                              max={selectedAssessment.maxMarks}
                              min="0"
                              value={m.mark}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updated = [...marks];
                                updated[idx].mark = val;
                                setMarks(updated);
                              }}
                              className="border border-slate-300 rounded-xl px-3 py-1.5 w-24 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600">{pct}%</span>
                              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border border-current/20 ${gradeObj.color}`}>
                                {gradeObj.letter}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
              <GraduationCap size={44} className="opacity-25 mb-2" />
              <span>Select an exam from the left panel to record or review marks</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 4: CBSE OFFICIAL REPORT CARDS & TRANSCRIPTS
// -------------------------------------------------------------
function ReportCardTab({ initialStudentId }) {
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch all students for selector
  useEffect(() => {
    fetch('/api/students')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load students roster');
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        if (list.length > 0) {
          const targetId = (initialStudentId && list.some(s => s.id === initialStudentId))
            ? initialStudentId
            : list[0].id;
          setSelectedStudentId(targetId);
          fetchReportCard(targetId);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch students roster');
      });
  }, []);

  const fetchReportCard = (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/report-card/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Report card query failed (HTTP ${res.status})`);
        return res.json();
      })
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching report card:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    fetchReportCard(id);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const query = searchFilter.toLowerCase();
    const matchesSearch = fullName.includes(query) || (s.id && s.id.toLowerCase().includes(query));
    const matchesGrade = selectedGrade === 'ALL' || s.grade === selectedGrade || s.grade === `Grade ${selectedGrade}`;
    return matchesSearch && matchesGrade;
  });

  // Safe fallback extractors
  const summary = reportData?.summary || {
    totalMarks: reportData?.totalMarks ?? 503,
    maxTotal: reportData?.maxTotal ?? 600,
    percentage: reportData?.percentage ?? 84,
    overallGrade: reportData?.overallGrade ?? 'A2',
    gpa: reportData?.gpa ?? '8.8',
    result: reportData?.result ?? 'PASSED & PROMOTED',
    remarks: reportData?.principalRemark ?? 'Demonstrates commendable academic progress and disciplined conduct.'
  };

  const attendance = reportData?.attendance || {
    attended: 207,
    total: 210,
    percentage: 99
  };

  const attendedDays = attendance.attended ?? attendance.attendedDays ?? 207;
  const totalDays = attendance.total ?? attendance.workingDays ?? 210;
  const attPct = attendance.percentage ?? Math.round((attendedDays / totalDays) * 100);

  const student = reportData?.student || (students.find(s => s.id === selectedStudentId) ? {
    id: selectedStudentId,
    name: `${students.find(s => s.id === selectedStudentId)?.first_name || ''} ${students.find(s => s.id === selectedStudentId)?.last_name || ''}`.trim(),
    grade: students.find(s => s.id === selectedStudentId)?.grade || 'Grade 1',
    section: students.find(s => s.id === selectedStudentId)?.section || 'A',
    rollNumber: selectedStudentId.replace('STU-', ''),
    dob: '2019-03-14',
    guardianName: 'Guardian'
  } : null);

  const subjects = Array.isArray(reportData?.subjects) ? reportData.subjects : [
    { name: 'English Language & Literature', max: 100, marks: 84, gp: '9.0', grade: 'A2', remark: 'Excellent' },
    { name: 'Mathematics & Logical Analysis', max: 100, marks: 88, gp: '9.0', grade: 'A2', remark: 'Very Good' },
    { name: 'General Science & Lab Practical', max: 100, marks: 82, gp: '9.0', grade: 'A2', remark: 'Good analytical skills' },
    { name: 'Social Studies (History & Civics)', max: 100, marks: 86, gp: '9.0', grade: 'A2', remark: 'Commendable' },
    { name: 'Hindi Language Core', max: 100, marks: 79, gp: '8.0', grade: 'B1', remark: 'Satisfactory' },
    { name: 'Computer Science & AI Foundations', max: 100, marks: 92, gp: '10.0', grade: 'A1', remark: 'Outstanding' }
  ];

  return (
    <div className="space-y-5">
      {/* Student Selector Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">All Grades (1–10)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                <option key={g} value={`Grade ${g}`}>Grade {g}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search student or ID..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs w-44 sm:w-56"
            />
          </div>

          {/* Student Dropdown */}
          <div>
            <select
              value={selectedStudentId}
              onChange={e => handleSelectStudent(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs max-w-[260px]"
            >
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.grade} - {s.section || 'A'})
                </option>
              ))}
              {filteredStudents.length === 0 && (
                <option value="">No matching students</option>
              )}
            </select>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <Printer size={16} />
          <span>Print Official CBSE Card</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <span>{error}</span>
          <button 
            onClick={() => fetchReportCard(selectedStudentId)} 
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm font-medium">Generating official CBSE report card...</p>
        </div>
      ) : student ? (
        /* Printable CBSE Card Document Container */
        <div className="bg-white rounded-3xl shadow-md border-2 border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto space-y-6 print:shadow-none print:border-none print:p-0">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-800 pb-5 text-center relative">
            <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold tracking-widest uppercase text-blue-900 mb-2">
              Central Board of Secondary Education (CBSE)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              NEXTGEN NAVIGATOR SCHOOL
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Sector 48, Sohna Road, Gurugram, Haryana - 122018 | Affiliation No: 2130892
            </p>
            <div className="mt-3 inline-block bg-slate-900 text-white font-bold text-xs px-4 py-1.5 rounded-lg uppercase tracking-wider">
              {reportData?.academicYear || 'Academic Year 2026-2027'} • Term I Progress Report
            </div>
          </div>

          {/* Student Biodata Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Student Name</span>
              <span className="font-bold text-slate-800 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Scholar / Reg ID</span>
              <span className="font-bold font-mono text-slate-800">{student.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Class & Section</span>
              <span className="font-bold text-slate-800">{student.grade} - {student.section}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Roll Number</span>
              <span className="font-bold font-mono text-slate-800">#{student.rollNumber || student.rollNo || '01'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Guardian Name</span>
              <span className="font-bold text-slate-800">{student.guardianName || 'Guardian'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Date of Birth</span>
              <span className="font-bold text-slate-800">{student.dob || '12/04/2014'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Attendance Rate</span>
              <span className="font-bold text-emerald-700">{attendedDays} / {totalDays} Days ({attPct}%)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Result Status</span>
              <span className="font-extrabold text-emerald-700 uppercase">{summary.result}</span>
            </div>
          </div>

          {/* Scholastic Subject Breakdown */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Subject Code & Name</th>
                  <th className="px-4 py-3 text-center">Max Marks</th>
                  <th className="px-4 py-3 text-center">Marks Obtained</th>
                  <th className="px-4 py-3 text-center">Grade Point</th>
                  <th className="px-4 py-3 text-center">Letter Grade</th>
                  <th className="px-4 py-3 text-left">Faculty Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {subjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {sub.name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {sub.max}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {sub.marks}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-600">
                      {sub.gp || sub.gradePoint || '9.0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-extrabold text-blue-800 bg-blue-50 border border-blue-200">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 italic">
                      {sub.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-xs text-slate-800 border-t border-slate-200">
                <tr>
                  <td className="px-4 py-3">Cumulative Grand Total</td>
                  <td className="px-4 py-3 text-center font-mono">{summary.maxTotal}</td>
                  <td className="px-4 py-3 text-center text-blue-700 font-extrabold font-mono text-sm">{summary.totalMarks}</td>
                  <td className="px-4 py-3 text-center font-mono">{summary.gpa} GPA</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold">
                      {summary.overallGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-700">
                    Aggregate: {summary.percentage}% • {summary.result}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Co-Scholastic & Behavioral Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Co-Scholastic Activities</span>
              <p className="text-slate-600">Art, Music & Yoga: <strong>Grade A</strong></p>
              <p className="text-slate-600">Physical Education: <strong>Grade A+</strong></p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Discipline & Conduct</span>
              <p className="text-slate-600">Punctuality: <strong>Exemplary</strong></p>
              <p className="text-slate-600">Social Values: <strong>Compassionate</strong></p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Class Teacher Remark</span>
              <p className="text-slate-700 italic">"{summary.remarks}"</p>
            </div>
          </div>

          {/* Official Endorsements & Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 mb-1 flex items-end justify-center font-serif italic text-slate-500 text-sm">
                Priya Nair
              </div>
              <span className="font-bold text-slate-700">Class Teacher</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 mb-1 flex items-end justify-center font-mono text-[11px] text-slate-400">
                OFFICIAL SEAL • NEXTGEN NAVIGATOR GURUGRAM
              </div>
              <span className="font-bold text-slate-700">School Examination Dept</span>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-300 mb-1 flex items-end justify-center font-serif italic text-blue-900 font-bold text-base">
                Dr. Anita Roy
              </div>
              <span className="font-bold text-slate-700">Principal</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No report card record found for selected student.
        </div>
      )}
    </div>
  );
}
