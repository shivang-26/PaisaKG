'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import {
  Users,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentFamily,
    familyMembers,
    isOffline,
    syncQueueCount,
    darkMode,
    toggleDarkMode,
    switchActiveUser,
    setActiveTab,
  } = useApp();

  const [showMemberMenu, setShowMemberMenu] = useState(false);

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#f2f5e8]/95 backdrop-blur-md border-b border-[#d5dbcb] transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <button
            id="nav-logo-btn"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none group hover:opacity-90 transition-opacity"
          >
            <Logo size="md" showText={true} />
            {currentFamily && (
              <span className="hidden md:inline-block text-xs font-semibold text-slate-600 pl-2 border-l border-[#d5dbcb]">
                {currentFamily.name}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Offline / Sync Indicator */}
          {isOffline ? (
            <div
              id="offline-status-badge"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200"
              title="Working Offline. Changes saved locally."
            >
              <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-700" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          ) : syncQueueCount > 0 ? (
            <div
              id="sync-status-badge"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#0a452b] text-xs font-semibold border border-emerald-200"
            >
              <Wifi className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{syncQueueCount} syncing</span>
            </div>
          ) : null}

          {/* Member Persona Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                id="user-persona-btn"
                onClick={() => setShowMemberMenu(!showMemberMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border border-[#d5dbcb] bg-white hover:bg-[#e5e9d3] transition-colors shadow-sm"
              >
                <img
                  src={currentUser.avatarUrl || 'https://picsum.photos/100'}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0a452b]/30"
                />
                <span className="text-xs font-bold text-[#0d1f15] hidden md:inline">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Persona Dropdown */}
              {showMemberMenu && (
                <div
                  id="user-persona-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-[#f2f5e8] rounded-2xl shadow-xl border border-[#d5dbcb] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-[#d5dbcb]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Switch Family Member
                    </p>
                    <p className="text-xs font-bold text-[#0d1f15] truncate">
                      Active: {currentUser.fullName}
                    </p>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto">
                    {familyMembers.map((m) => (
                      <button
                        key={m.userId}
                        onClick={() => {
                          switchActiveUser(m.userId);
                          setShowMemberMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#e5e9d3] transition-colors ${
                          m.userId === currentUser.id ? 'bg-[#e5e9d3] text-[#0a452b] font-bold' : 'text-[#0d1f15]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatarUrl || 'https://picsum.photos/100'}
                            alt={m.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-semibold leading-tight">{m.fullName}</p>
                            <p className="text-[10px] text-slate-500">{m.role}</p>
                          </div>
                        </div>
                        {m.userId === currentUser.id && (
                          <UserCheck className="w-4 h-4 text-[#0a452b]" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[#d5dbcb] pt-1 mt-1 px-2">
                    <button
                      onClick={() => {
                        setActiveTab('family');
                        setShowMemberMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#0a452b] hover:bg-[#e5e9d3] rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4 text-[#0a452b]" />
                      Manage Family Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
