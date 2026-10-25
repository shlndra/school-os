import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  GraduationCap, 
  Receipt, 
  Store, 
  Users, 
  CircleDollarSign, 
  ShieldCheck, 
  Smartphone, 
  FileCheck2, 
  Menu, 
  X, 
  Sparkles,
  Search
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Admissions from './pages/Admissions';
import Classroom from './pages/Classroom';
import Fees from './pages/Fees';
import CampusStore from './pages/CampusStore';
import StaffHR from './pages/StaffHR';
import Payroll from './pages/Payroll';
import CampusSafety from './pages/CampusSafety';
import ParentApp from './pages/ParentApp';
import TransferCertificate from './pages/TransferCertificate';
import GlobalSearchModal from './components/GlobalSearchModal';

const DEV_PERSONAS = [
  { id: 'STF-001', name: 'Meera Iyer', role: 'Principal', token: 'dev-token-principal-meera' },
  { id: 'STF-003', name: 'Sunita Devi', role: 'Teacher', token: 'dev-token-teacher-sunita' },
  { id: 'STF-007', name: 'Anita Sharma', role: 'Accountant', token: 'dev-token-accountant-anita' },
  { id: 'STF-011', name: 'Deepak Gupta', role: 'Librarian', token: 'dev-token-librarian-deepak' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [navParams, setNavParams] = useState(null);
  const [activePersona, setActivePersona] = useState(DEV_PERSONAS[0]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalNavigate = (page, params) => {
    setCurrentPage(page);
    setNavParams(params);
  };

  const navItems = [
    { id: 'dashboard', label: 'Central Command Hub', badge: 'Pulse', icon: LayoutDashboard },
    { id: 'admissions', label: '1. Admissions & ID Cards', badge: 'Pillar 1', icon: UserPlus },
    { id: 'classroom', label: '2. Academics & Timetable', badge: 'Pillar 2', icon: GraduationCap },
    { id: 'fees', label: '3. Fees & Collection', badge: 'Pillar 3', icon: Receipt },
    { id: 'store', label: '3. Campus Store & POS', badge: 'Pillar 3', icon: Store },
    { id: 'staff', label: '4. Staff HR & Substitutes', badge: 'Pillar 4', icon: Users },
    { id: 'payroll', label: '4. Payroll Processing', badge: 'Pillar 4', icon: CircleDollarSign },
    { id: 'safety', label: '5. Buses, Clinic & Library', badge: 'Pillar 5', icon: ShieldCheck },
    { id: 'parent_app', label: '6. Parent & Student App', badge: 'Pillar 6', icon: Smartphone },
    { id: 'tc', label: 'Transfer Clearance (TC)', badge: 'Admin', icon: FileCheck2 },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={(page) => { setNavParams(null); setCurrentPage(page); }} />;
      case 'admissions': return <Admissions initialParams={navParams} />;
      case 'classroom': return <Classroom initialParams={navParams} />;
      case 'fees': return <Fees initialParams={navParams} />;
      case 'store': return <CampusStore initialParams={navParams} />;
      case 'staff': return <StaffHR initialParams={navParams} />;
      case 'payroll': return <Payroll />;
      case 'safety': return <CampusSafety />;
      case 'transport': return <CampusSafety />; // backwards compatibility with older dashboard links
      case 'parent_app': return <ParentApp />;
      case 'tc': return <TransferCertificate />;
      default: return <Dashboard onNavigate={(page) => { setNavParams(null); setCurrentPage(page); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
            OS
          </div>
          <div>
            <h1 className="text-base font-extrabold leading-tight">School OS</h1>
            <p className="text-[10px] text-slate-400">Gurugram Campus</p>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Modern Fixed Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'block' : 'hidden'} 
        md:block md:w-68 bg-slate-900 text-white flex-shrink-0 min-h-screen border-r border-slate-800
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-base shadow-lg shadow-blue-500/20 text-white">
              OS
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                School OS
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 block">
                NextGen Navigator School • NCR
              </span>
            </div>
          </div>
        </div>

        {/* 6-Pillar Architecture Navigation */}
        <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden md:block px-4 pt-4">
          6-Pillar Architecture
        </div>

        <nav className="px-2.5 pb-6">
          <ul className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all group
                      ${isActive 
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-medium'}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                      <span className="text-xs truncate">{item.label}</span>
                    </div>

                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${
                      isActive 
                        ? 'bg-blue-700/60 text-blue-100' 
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Institutional Campus Footer */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/40 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All 6 Pillars Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            CBSE Sector 48 Sohna Rd, Gurugram NCR
          </p>
        </div>
      </aside>

      {/* Main App Workspace */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Institutional Top Application Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-2xs">
          {/* Global Search Quick Trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/80 transition-all text-xs sm:text-sm font-medium w-full max-w-md text-left shadow-2xs group cursor-pointer"
          >
            <Search size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            <span className="flex-1 truncate">Search students, staff, fees, admissions, store...</span>
            <div className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </div>
          </button>

          {/* Local Development RBAC Persona Switcher */}
          {import.meta.env.MODE !== 'production' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden lg:inline">
                Actor:
              </span>
              <select
                value={activePersona.id}
                onChange={(e) => {
                  const found = DEV_PERSONAS.find(p => p.id === e.target.value);
                  if (found) setActivePersona(found);
                }}
                className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                title="Switch Active Actor Persona (Development Authentication)"
              >
                {DEV_PERSONAS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 max-w-7xl w-full mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        token={activePersona.token}
        activePersona={activePersona}
        onNavigate={handleGlobalNavigate}
      />
    </div>
  );
}
