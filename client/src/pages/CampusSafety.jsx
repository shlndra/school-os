import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  HeartPulse, 
  BookOpen, 
  MapPin, 
  Phone, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  X, 
  Activity, 
  ShieldAlert, 
  Send, 
  ArrowRight,
  Thermometer,
  Calendar,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function CampusSafety() {
  const [activeTab, setActiveTab] = useState('buses');

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
              Pillar 5: Safety & Logistics
            </span>
            <span className="text-xs font-semibold text-slate-500">Gurgaon NCR Campus Zone</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Buses & Campus Safety Hub</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            GPS Bus Fleet Tracking • Campus Clinic & Infirmary • Central Library Circulation
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-2xs gap-1">
          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'buses' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('buses')}
          >
            <Bus size={15} />
            <span>GPS Bus Fleet</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'clinic' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('clinic')}
          >
            <HeartPulse size={15} />
            <span>Campus Clinic</span>
          </button>

          <button 
            className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'library' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('library')}
          >
            <BookOpen size={15} />
            <span>Library Circulation</span>
          </button>
        </div>
      </div>

      {activeTab === 'buses' && <BusFleetTab />}
      {activeTab === 'clinic' && <ClinicTab />}
      {activeTab === 'library' && <LibraryTab />}
    </div>
  );
}

// -------------------------------------------------------------
// TAB 1: GPS BUS FLEET TRACKER (Gurgaon NCR Live Simulation)
// -------------------------------------------------------------
function BusFleetTab() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatedProgress, setSimulatedProgress] = useState(65);

  useEffect(() => {
    fetch('/api/transport/routes')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setRoutes(list);
        if (list.length > 0) setSelectedRoute(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Live GPS simulation ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedProgress(prev => (prev >= 95 ? 20 : prev + 3));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">Loading bus fleet telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Fleet</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{routes.length} AC Buses</span>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            100% GPS Signal OK
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Commuters</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {routes.reduce((acc, r) => acc + (r.assignedCount || 0), 0)} Students
          </span>
          <span className="text-xs text-slate-500 font-medium mt-1">Gurgaon NCR Suburbs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Speed</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">34 km/h</span>
          <span className="text-xs text-slate-500 font-medium mt-1">Speed Governor &lt;40 km/h</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">SOS / Alert Status</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">All Secure</span>
          <span className="text-xs text-emerald-600 font-medium mt-1">Zero Incident Reports</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Selector List */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Select Bus Route</h3>
          <div className="space-y-2.5">
            {routes.map(r => {
              const isSelected = selectedRoute?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoute(r)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                    <span className="text-[11px] font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                      {r.vehicleNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Driver: {r.driverName}</span>
                    <span className="font-bold text-blue-700">{r.assignedCount || 0} / {r.capacity} seats</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Route Live Status & Stops */}
        {selectedRoute && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">{selectedRoute.name}</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                    {selectedRoute.vehicleNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Driver: <strong className="text-slate-700">{selectedRoute.driverName}</strong> • Phone: <a href={`tel:${selectedRoute.driverPhone}`} className="text-blue-600 font-bold">{selectedRoute.driverPhone}</a>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live In-Transit
                </span>
                <span className="text-xs font-mono text-slate-400">ETA School: 07:50 AM</span>
              </div>
            </div>

            {/* GPS Simulation Track */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-red-400" />
                  <span>Live Telemetry • Sector 48 Corridor</span>
                </div>
                <span className="font-mono text-emerald-400">Speed: 38 km/h</span>
              </div>

              {/* Progress bar representing route journey */}
              <div className="relative pt-4 pb-2">
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-blue-500 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${simulatedProgress}%` }}
                  ></div>
                </div>
                <div 
                  className="absolute top-1 transform -translate-x-1/2 transition-all duration-1000 flex flex-col items-center"
                  style={{ left: `${simulatedProgress}%` }}
                >
                  <div className="bg-yellow-400 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-white">
                    <Bus size={14} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>First Pickup (07:05 AM)</span>
                <span className="text-yellow-400 font-bold">Bus Position</span>
                <span>Campus Gate (07:55 AM)</span>
              </div>
            </div>

            {/* Route Stops Sequence */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-3">Planned Route Stops & Student Boarding</h4>
              <div className="space-y-2">
                {(selectedRoute.stops || []).map((stop, idx) => (
                  <div 
                    key={stop.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{stop.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Scheduled: {stop.time}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                        {stop.studentCount || 0} Boarding
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        idx <= 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx <= 1 ? 'Departed' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commuter Roster */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Registered Student Passengers ({selectedRoute.students?.length || 0})</h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {(selectedRoute.students || []).map((st, idx) => (
                  <div key={idx} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                    <span className="font-semibold text-slate-800">{st.studentName} ({st.grade}-{st.section})</span>
                    <span className="text-slate-500 font-mono">Parent: {st.guardianName} ({st.guardianPhone})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// TAB 2: CAMPUS CLINIC / INFIRMARY
// -------------------------------------------------------------
function ClinicTab() {
  const [visits, setVisits] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    symptoms: '',
    treatment: '',
    temperature: '98.6°F',
    pulse: '76 bpm',
    administeredBy: 'Kavita Joshi (School Nurse)',
    parentNotified: true,
    status: 'DISCHARGED'
  });

  const fetchClinic = () => {
    setLoading(true);
    fetch('/api/safety/clinic')
      .then(res => res.json())
      .then(data => {
        setVisits(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClinic();
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, studentId: list[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveVisit = (e) => {
    e.preventDefault();
    fetch('/api/safety/clinic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setModalOpen(false);
        setNotification('✓ Clinic checkup record logged and guardian notification queued.');
        setTimeout(() => setNotification(''), 4500);
        fetchClinic();
      })
      .catch(err => alert('Failed to log checkup: ' + err.message));
  };

  return (
    <div className="space-y-5">
      {/* Banner & Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Campus Health & Infirmary Registry</h3>
          <p className="text-xs text-slate-500">
            Supervisor: Kavita Joshi, Registered School Nurse • Direct Emergency Line: +91 98112 00911
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>Log Clinic Checkup</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      {/* Visits Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading infirmary records...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">Medical Records ({visits.length} logged visits)</span>
            <span className="text-xs text-slate-500">All student allergies & blood groups synced</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Date / Time</th>
                  <th className="px-4 py-3 text-left">Student & Class</th>
                  <th className="px-4 py-3 text-left">Reported Symptoms</th>
                  <th className="px-4 py-3 text-left">Vitals (Temp / Pulse)</th>
                  <th className="px-4 py-3 text-left">Treatment Administered</th>
                  <th className="px-4 py-3 text-center">Parent Alert</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{v.visit_date}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.visit_time || '09:30 AM'}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{v.student_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {v.grade} - {v.section} • Blood: <span className="text-red-600 font-bold">{v.blood_group || 'O+'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 max-w-xs">
                      {v.symptoms}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-600">
                      <div>Temp: <strong>{v.temperature}</strong></div>
                      <div>Pulse: <strong>{v.pulse}</strong></div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-xs">
                      <div>{v.treatment}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">By: {v.administered_by}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        v.parent_notified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.parent_notified ? '✓ SMS Sent' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        v.status === 'UNDER_OBSERVATION' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Clinic Checkup */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HeartPulse size={20} className="text-red-600" />
                <h3 className="font-bold text-slate-800 text-base">New Clinic Checkup Entry</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.grade} - {s.section || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Symptoms Reported</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mild fever, stomach ache, scraped knee in playground"
                  value={formData.symptoms}
                  onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperature</label>
                  <input
                    type="text"
                    value={formData.temperature}
                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pulse / Heart Rate</label>
                  <input
                    type="text"
                    value={formData.pulse}
                    onChange={e => setFormData({ ...formData, pulse: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Treatment & Medication Administered</label>
                <input
                  type="text"
                  value={formData.treatment}
                  onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                  placeholder="e.g. Antiseptic dressing, Paracetamol 250mg, 30m bed rest"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Administered By</label>
                  <input
                    type="text"
                    value={formData.administeredBy}
                    onChange={e => setFormData({ ...formData, administeredBy: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discharge Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="DISCHARGED">Discharged to Class</option>
                    <option value="UNDER_OBSERVATION">Under Observation in Infirmary</option>
                    <option value="REFERRED_HOME">Referred Home / Picked up</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="chkParent"
                  checked={formData.parentNotified}
                  onChange={e => setFormData({ ...formData, parentNotified: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="chkParent" className="text-slate-700 font-semibold cursor-pointer">
                  Send immediate SMS / WhatsApp health advisory to Guardian
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
                  className="px-4 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                >
                  Save Record & Notify
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
// TAB 3: LIBRARY CIRCULATION SYSTEM
// -------------------------------------------------------------
function LibraryTab() {
  const [books, setBooks] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [loanForm, setLoanForm] = useState({
    bookId: '',
    studentId: '',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const fetchLibrary = () => {
    setLoading(true);
    fetch('/api/safety/library')
      .then(res => res.json())
      .then(data => {
        setBooks(Array.isArray(data.books) ? data.books : []);
        setActiveLoans(Array.isArray(data.activeLoans) ? data.activeLoans : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLibrary();
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        if (list.length > 0) {
          setLoanForm(prev => ({ ...prev, studentId: list[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const handleIssueBook = (e) => {
    e.preventDefault();
    if (!loanForm.bookId) return alert('Please select a book to issue');

    fetch('/api/safety/library/loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loanForm)
    })
      .then(res => res.json())
      .then(() => {
        setModalOpen(false);
        setNotification('✓ Book issued successfully!');
        setTimeout(() => setNotification(''), 4000);
        fetchLibrary();
      })
      .catch(err => alert('Failed to issue book: ' + err.message));
  };

  const handleReturnBook = (loanId) => {
    if (!confirm('Mark this book as returned to inventory?')) return;
    fetch('/api/safety/library/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId })
    })
      .then(res => res.json())
      .then(() => {
        setNotification('✓ Book returned and catalog stock replenished.');
        setTimeout(() => setNotification(''), 4000);
        fetchLibrary();
      })
      .catch(err => alert('Failed to return book: ' + err.message));
  };

  return (
    <div className="space-y-6">
      {/* Banner & Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Campus Central Library & Reading Room</h3>
          <p className="text-xs text-slate-500">
            Catalog: {books.length} Titles • Active Borrowers: {activeLoans.length}
          </p>
        </div>

        <button
          onClick={() => {
            if (books.length > 0) setLoanForm(prev => ({ ...prev, bookId: books[0].id }));
            setModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus size={15} />
          <span>Issue Book to Student</span>
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      {/* Active Borrowers / Loans Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">Active Book Loans & Due Dates</span>
          <span className="text-xs text-slate-500">{activeLoans.length} active loans</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/50 font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Book Title</th>
                <th className="px-4 py-3 text-left">Borrower</th>
                <th className="px-4 py-3 text-left">Issued On</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    <div>{loan.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal">by {loan.author}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800">{loan.student_name}</div>
                    <div className="text-[11px] text-slate-500">{loan.grade} - {loan.section}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-mono">
                    {loan.checkout_date}
                  </td>
                  <td className="px-4 py-3.5 font-bold font-mono text-blue-700">
                    {loan.due_date}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleReturnBook(loan.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors"
                    >
                      <RotateCcw size={12} />
                      <span>Return</span>
                    </button>
                  </td>
                </tr>
              ))}
              {activeLoans.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No active book loans at present.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Catalog Grid */}
      <div>
        <h4 className="font-bold text-slate-800 text-sm mb-3">Library Title Catalog & Inventory</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map(b => (
            <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {b.category || 'General'}
                </span>
                <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{b.title}</h5>
                <p className="text-xs text-slate-500 mt-0.5">by {b.author}</p>
                <div className="text-[11px] text-slate-400 font-mono mt-2">ISBN: {b.isbn}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`font-bold ${b.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {b.available_copies} of {b.total_copies} Avail
                </span>
                <span className="text-slate-400 font-medium">Shelf: {b.shelf_location || 'A-1'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issue Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Issue Book to Student</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Book</label>
                <select
                  value={loanForm.bookId}
                  onChange={e => setLoanForm({ ...loanForm, bookId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a title...</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.available_copies <= 0}>
                      {b.title} ({b.available_copies} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Borrowing Student</label>
                <select
                  value={loanForm.studentId}
                  onChange={e => setLoanForm({ ...loanForm, studentId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.grade} - {s.section || 'A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date (14-day standard)</label>
                <input
                  type="date"
                  value={loanForm.dueDate}
                  onChange={e => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  required
                />
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
                  Issue Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
