import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  User, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Users, 
  Navigation,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Radio
} from 'lucide-react';

export default function Transport() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteStudents, setSelectedRouteStudents] = useState(null);
  const [activeZone, setActiveZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/transport/routes')
      .then(res => res.json())
      .then(data => {
        setRoutes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load routes:', err);
        setLoading(false);
      });
  }, []);

  const totalStudents = routes.reduce((sum, r) => sum + (r.assignedCount || 0), 0);
  const totalStops = routes.reduce((sum, r) => sum + (r.stops?.length || 0), 0);

  const filteredRoutes = routes.filter(r => {
    const routeText = `${r.name || r.route_name || ''} ${r.vehicleNumber || r.vehicle_number || ''} ${r.driverName || ''}`.toLowerCase();
    const matchesSearch = routeText.includes(searchQuery.toLowerCase());
    
    if (activeZone === 'GURGAON') {
      return matchesSearch && (r.id === 'BUS-R1' || r.id === 'BUS-R2');
    }
    if (activeZone === 'DELHI') {
      return matchesSearch && (r.id === 'BUS-R3' || r.id === 'BUS-R4');
    }
    return matchesSearch;
  });

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Gurgaon & Delhi NCR transport routes...</div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">Campus Transport & Bus Routes</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live GPS Active
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Gurgaon & Delhi NCR School Transit Network</p>
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search route, sector, stop..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Bus Fleet</span>
            <Bus size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{routes.length} Active Busses</div>
          <div className="text-xs text-slate-400 mt-0.5">Air Conditioned & GPS Tracked</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total NCR Stops</span>
            <MapPin size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalStops} Designated Stops</div>
          <div className="text-xs text-slate-400 mt-0.5">Gurgaon & Delhi Metro Nodes</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Student Riders</span>
            <Users size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{totalStudents} Commuters</div>
          <div className="text-xs text-slate-400 mt-0.5">Seat Occupancy Monitored</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Safety Protocol</span>
            <ShieldCheck size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">100% Verified</div>
          <div className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={12} /> CCTV & Speed Governor Compliant
          </div>
        </div>
      </div>

      {/* Zone Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveZone('ALL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            activeZone === 'ALL'
              ? 'bg-slate-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All NCR Routes ({routes.length})
        </button>
        <button
          onClick={() => setActiveZone('GURGAON')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            activeZone === 'GURGAON'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Gurgaon City (Golf Course & Sohna Rd)
        </button>
        <button
          onClick={() => setActiveZone('DELHI')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
            activeZone === 'DELHI'
              ? 'bg-purple-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Delhi Corridors (Dwarka Exp & South Delhi)
        </button>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoutes.map((route, rIdx) => {
          const routeName = route.name || route.route_name || `Route ${rIdx + 1}`;
          const vehicleNum = route.vehicleNumber || route.vehicle_number || 'HR-26-XX-0000';
          const driverName = route.driverName || 'Designated Driver';
          const driverPhone = route.driverPhone || '+91 98765 00000';
          const assignedCount = route.assignedCount || route.students?.length || 0;
          const capacity = route.capacity || 40;
          const occupancyPct = Math.round((assignedCount / capacity) * 100);
          const isRosterOpen = selectedRouteStudents === route.id;

          return (
            <div key={route.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between transition-all hover:shadow-md">
              {/* Card Header */}
              <div>
                <div className="bg-slate-800 text-white p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-700/80 text-blue-400 flex items-center justify-center shadow-inner mt-0.5">
                        <Bus size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{routeName}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="bg-amber-400 text-slate-900 font-extrabold text-xs px-2.5 py-0.5 rounded font-mono tracking-wider">
                            {vehicleNum}
                          </span>
                          <span className="text-xs text-slate-300">
                            {capacity} Seater Coach
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center text-xs text-slate-300 justify-end gap-1 mb-0.5">
                        <User size={13} className="text-slate-400" />
                        <span className="font-medium">Assigned Driver</span>
                      </div>
                      <div className="font-bold text-sm text-white">{driverName}</div>
                      <a href={`tel:${driverPhone}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1 mt-0.5">
                        <Phone size={11} /> {driverPhone}
                      </a>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Seat Occupancy: <strong className="text-white">{assignedCount} / {capacity} Seats</strong></span>
                    <div className="w-36 bg-slate-700 rounded-full h-2 overflow-hidden ml-2">
                      <div 
                        className={`h-2 rounded-full ${occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, occupancyPct || 25)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Itinerary Timeline of Stops */}
                <div className="p-6 relative bg-white">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Navigation size={14} className="text-blue-600" />
                    <span>Scheduled Morning Pickup Sequence & NCR Landmarks</span>
                  </div>

                  {/* Vertical Route Line */}
                  <div className="absolute left-[39px] top-14 bottom-10 w-0.5 bg-slate-200"></div>
                  
                  <div className="space-y-4">
                    {(route.stops || []).map((stop, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === (route.stops.length - 1);
                      const stopName = stop.name || stop.stopName || `Stop ${idx + 1}`;
                      const pickupTime = stop.time || stop.pickupTime || '07:00 AM';
                      const studentCount = stop.studentCount || 0;

                      return (
                        <div key={idx} className="flex items-start relative z-10 group">
                          {/* Pin bullet */}
                          <div className={`w-4 h-4 rounded-full mt-1.5 ml-[11px] mr-4 flex-shrink-0 border-2 transition-all ${
                            isLast 
                              ? 'bg-emerald-500 border-white ring-2 ring-emerald-500' 
                              : isFirst 
                              ? 'bg-blue-600 border-white ring-2 ring-blue-600' 
                              : 'bg-white border-blue-500'
                          }`}></div>

                          {/* Stop Details Card */}
                          <div className="flex-1 bg-slate-50/80 group-hover:bg-blue-50/50 rounded-xl p-3 border border-slate-100 group-hover:border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-all">
                            <div className="flex-1 pr-2">
                              <div className="font-semibold text-slate-800 text-sm flex items-start gap-1.5">
                                <MapPin size={15} className={`flex-shrink-0 mt-0.5 ${isLast ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className={isLast ? 'text-emerald-900 font-bold' : ''}>{stopName}</span>
                              </div>
                              {studentCount > 0 && (
                                <span className="text-[11px] text-blue-600 font-medium ml-5 block mt-0.5">
                                  👥 {studentCount} student{studentCount > 1 ? 's' : ''} boarding here
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 sm:self-center">
                              <div className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center shadow-2xs whitespace-nowrap">
                                <Clock size={13} className="mr-1.5 text-blue-600" />
                                {pickupTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer: Student Roster Accordion */}
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setSelectedRouteStudents(isRosterOpen ? null : route.id)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors p-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Users size={15} className="text-blue-600" />
                    <span>View Student Passenger List ({assignedCount} Students)</span>
                  </span>
                  {isRosterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isRosterOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-2 max-h-44 overflow-y-auto">
                    {route.students && route.students.length > 0 ? (
                      route.students.map((stu, sIdx) => (
                        <div key={sIdx} className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{stu.studentName}</span>
                            <span className="text-slate-400 ml-1.5 font-medium">({stu.grade} {stu.section})</span>
                          </div>
                          {stu.guardianPhone && (
                            <a href={`tel:${stu.guardianPhone}`} className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                              <Phone size={11} /> {stu.guardianPhone}
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-xs italic py-2 text-center">
                        No students assigned to this route yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300">
            No transport routes match your search.
          </div>
        )}
      </div>
    </div>
  );
}
