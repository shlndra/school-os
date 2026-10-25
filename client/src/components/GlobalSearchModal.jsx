import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, GraduationCap, Users, Receipt, 
  FileText, Store, ArrowRight, CornerDownLeft, 
  AlertCircle, ShieldCheck, ShieldAlert, Loader2,
  Sparkles
} from 'lucide-react';
import { useDebounceSearch } from '../hooks/useDebounceSearch';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  token,
  onNavigate,
  activePersona
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { query, setQuery, results, loading, error, clear } = useDebounceSearch({
    token,
    delay: 250,
    minChars: 2
  });

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      clear();
    }
  }, [isOpen]);

  // Flatten items for linear arrow key navigation
  const flattenedItems = useMemo(() => {
    if (!results?.results) return [];
    const r = results.results;
    const items = [];

    const categories = [
      { key: 'students', label: 'Students', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
      { key: 'staff', label: 'Staff HR', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
      { key: 'fees', label: 'Fees & Invoices', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
      { key: 'admissions', label: 'Admissions Pipeline', icon: FileText, color: 'text-amber-600 bg-amber-50' },
      { key: 'store', label: 'Campus Store', icon: Store, color: 'text-purple-600 bg-purple-50' },
    ];

    categories.forEach(cat => {
      if (selectedCategory !== 'ALL' && selectedCategory !== cat.key) return;
      const list = r[cat.key] || [];
      list.forEach(item => {
        items.push({
          ...item,
          domainConfig: cat
        });
      });
    });

    return items;
  }, [results, selectedCategory]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flattenedItems.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (flattenedItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flattenedItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flattenedItems.length) % flattenedItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flattenedItems[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flattenedItems, selectedIndex]);

  const handleSelect = (item) => {
    onClose();
    if (!onNavigate) return;

    // Navigate to target domain and pre-select item
    switch (item.category) {
      case 'students':
        onNavigate('classroom', { studentId: item.id });
        break;
      case 'staff':
        onNavigate('staff', { staffId: item.id });
        break;
      case 'fees':
        onNavigate('fees', { invoiceId: item.id });
        break;
      case 'admissions':
        onNavigate('admissions', { applicantId: item.id });
        break;
      case 'store':
        onNavigate('store', { itemId: item.id });
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  const totalMatches = results?.pagination?.totalMatches || 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search size={20} className="text-slate-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, staff, invoices, admissions, or items... (e.g., Sharma, Uniform)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 text-base text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
          />

          {loading && (
            <Loader2 size={18} className="text-blue-600 animate-spin shrink-0 mr-2" />
          )}

          {query && !loading && (
            <button
              onClick={clear}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-1"
            >
              <X size={18} />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600">ESC</kbd>
          </div>
        </div>

        {/* Actor Security Banner */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>
              Verified Actor: <strong className="text-slate-700">{activePersona?.name || 'Staff Member'}</strong> ({activePersona?.role || 'Staff'})
            </span>
          </div>

          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Bearer Verified • RBAC Active
          </span>
        </div>

        {/* Category Filter Pills (if results exist) */}
        {results?.results && totalMatches > 0 && (
          <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalMatches})
            </button>
            {results.results.students?.length > 0 && (
              <button
                onClick={() => setSelectedCategory('students')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedCategory === 'students'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Students ({results.results.students.length})
              </button>
            )}
            {results.results.staff?.length > 0 && (
              <button
                onClick={() => setSelectedCategory('staff')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedCategory === 'staff'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Staff ({results.results.staff.length})
              </button>
            )}
            {results.results.fees?.length > 0 && (
              <button
                onClick={() => setSelectedCategory('fees')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedCategory === 'fees'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fees ({results.results.fees.length})
              </button>
            )}
            {results.results.admissions?.length > 0 && (
              <button
                onClick={() => setSelectedCategory('admissions')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedCategory === 'admissions'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Admissions ({results.results.admissions.length})
              </button>
            )}
            {results.results.store?.length > 0 && (
              <button
                onClick={() => setSelectedCategory('store')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  selectedCategory === 'store'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Store ({results.results.store.length})
              </button>
            )}
          </div>
        )}

        {/* Content Body: States */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[160px]">
          {/* Initial Idle Hint */}
          {!query && (
            <div className="py-12 px-6 text-center text-slate-400 space-y-2">
              <Sparkles size={32} className="mx-auto text-blue-500 opacity-80" />
              <p className="text-sm font-medium text-slate-600">Type at least 2 characters to search School OS</p>
              <p className="text-xs text-slate-400">
                Instantly search across Students, Staff, Accounts, Admissions & Campus Store
              </p>
            </div>
          )}

          {/* Short query hint */}
          {query && query.trim().length === 1 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Please enter at least 2 characters...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 mx-2 my-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Search Request Failed</h4>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !results && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-slate-200"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="w-1/3 h-3.5 bg-slate-200 rounded"></div>
                    <div className="w-1/2 h-2.5 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && results && flattenedItems.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldAlert size={32} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No matching records found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No authorized records matching <span className="font-semibold text-slate-600">"{query}"</span> were found in your permitted domains.
              </p>
            </div>
          )}

          {/* Result Items */}
          {flattenedItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = item.domainConfig.icon;

            return (
              <div
                key={`${item.category}-${item.id}`}
                data-index={idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border border-blue-200 text-blue-950 shadow-2xs'
                    : 'hover:bg-slate-50 border border-transparent text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.domainConfig.color}`}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{item.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500 shrink-0">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Badges & Selection Indicator */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {/* Staff Salary Badge (Exclusively rendered if backend returned it) */}
                  {item.meta?.baseSalary !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      ₹{Number(item.meta.baseSalary).toLocaleString('en-IN')}/mo
                    </span>
                  )}

                  {/* Fee Balance Badge (Exclusively rendered if backend returned it) */}
                  {item.meta?.totalAmount !== undefined && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Total: ₹{Number(item.meta.totalAmount).toLocaleString('en-IN')}
                    </span>
                  )}

                  <ArrowRight 
                    size={15} 
                    className={`transition-transform ${
                      isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                    }`} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-600">ESC</kbd> Close
            </span>
          </div>

          <div>
            {totalMatches > 0 && (
              <span>{totalMatches} match{totalMatches === 1 ? '' : 'es'} found</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
