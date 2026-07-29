'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  BarChart3,
  Users,
} from 'lucide-react';

interface BottomNavProps {
  onOpenScanModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenScanModal }) => {
  const { activeTab, setActiveTab } = useApp();

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'expenses' as const,
      label: 'Expenses',
      icon: Receipt,
    },
    {
      id: 'scan' as const,
      label: 'Scan',
      icon: ScanLine,
      isAction: true,
    },
    {
      id: 'reports' as const,
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'family' as const,
      label: 'Family',
      icon: Users,
    },
  ];

  return (
    <nav id="app-bottom-nav" className="fixed bottom-0 left-0 right-0 z-30 bg-[#f2f5e8]/95 backdrop-blur-lg border-t border-[#d5dbcb] pb-safe transition-colors">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <div key={tab.id} className="relative -top-5">
                <button
                  id="bottom-nav-scan-btn"
                  onClick={onOpenScanModal}
                  className="w-14 h-14 rounded-full bg-[#0a452b] text-white flex flex-col items-center justify-center shadow-lg hover:bg-[#07331f] hover:scale-105 active:scale-95 transition-all ring-4 ring-[#e5e9d3]"
                  aria-label="Scan Receipt"
                >
                  <ScanLine className="w-5 h-5 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-tight">SCAN</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              id={`bottom-nav-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#0a452b] font-bold scale-105'
                  : 'text-slate-600 hover:text-[#0d1f15] font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
