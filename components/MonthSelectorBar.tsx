'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

interface MonthSelectorBarProps {
  className?: string;
  showAllOption?: boolean;
}

export const MonthSelectorBar: React.FC<MonthSelectorBarProps> = ({
  className = '',
  showAllOption = true,
}) => {
  const {
    selectedMonthFilter,
    setSelectedMonthFilter,
    availableMonths,
    goToPreviousMonth,
    goToNextMonth,
  } = useApp();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getMonthLabel = (key: string) => {
    if (key === 'ALL') return 'All Time Expenses';
    const parts = key.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${monthNames[monthIdx]} ${year}`;
      }
    }
    return key;
  };

  const isCurrentMonth = selectedMonthFilter === currentMonthKey;

  return (
    <div
      id="month-selector-bar"
      className={`flex flex-wrap items-center justify-between gap-3 p-2.5 px-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#0a452b]/10 text-[#0a452b] flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
            Viewing Period
          </span>
          <span className="text-xs font-bold text-[#0d1f15] block">
            {getMonthLabel(selectedMonthFilter)}
          </span>
        </div>
      </div>

      {/* Month Navigation Controls */}
      <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
        <button
          onClick={goToPreviousMonth}
          title="Previous Month"
          className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-[#e5e9d3] hover:border-[#0a452b]/30 hover:text-[#0a452b] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Month Dropdown Select */}
        <div className="relative">
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-[#0d1f15] hover:border-[#0a452b]/50 focus:outline-none focus:ring-2 focus:ring-[#0a452b]/20 cursor-pointer transition-all"
          >
            {availableMonths.map((m) => {
              if (!showAllOption && m.value === 'ALL') return null;
              return (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <button
          onClick={goToNextMonth}
          title="Next Month"
          className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-[#e5e9d3] hover:border-[#0a452b]/30 hover:text-[#0a452b] transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {!isCurrentMonth && (
          <button
            onClick={() => setSelectedMonthFilter(currentMonthKey)}
            className="px-2.5 py-1 rounded-xl bg-[#0a452b] text-white text-[11px] font-bold shadow-xs hover:bg-[#07331f] transition-all ml-1 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-300" />
            Current Month
          </button>
        )}
      </div>
    </div>
  );
};
