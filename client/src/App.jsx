import React, { useState } from 'react';
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
  Sparkles
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'dashboard': return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
      case 'admissions': return <Admissions />;
      case 'classroom': return <Classroom />;
      case 'fees': return <Fees />;
      case 'store': return <CampusStore />;
      case 'staff': return <StaffHR />;
      case 'payroll': return <Payroll />;
      case 'safety': return <CampusSafety />;
      case 'transport': return <CampusSafety />; // backwards compatibility with older dashboard links
      case 'parent_app': return <ParentApp />;
      case 'tc': return <TransferCertificate />;
      default: return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 max-w-7xl w-full mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
