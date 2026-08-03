'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/UserAvatar';
import {
  Moon,
  Sun,
  Wifi,
  WifiOff,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  User,
  LogOut,
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
    logout,
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
                <UserAvatar
                  src={currentUser.avatarUrl}
                  name={currentUser.fullName}
                  className="w-7 h-7 rounded-full text-[11px]"
                  iconClassName="w-3.5 h-3.5"
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
                  className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Switch Family Member
                    </p>
                    <p className="text-xs font-bold text-[#0d1f15] truncate">
                      Active: {currentUser.fullName}
                    </p>
                  </div>

                  <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                    {familyMembers.map((m) => (
                      <button
                        key={m.userId}
                        onClick={() => {
                          switchActiveUser(m.userId);
                          setShowMemberMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                          m.userId === currentUser.id
                            ? 'bg-[#e5e9d3]/80 text-[#0a452b] font-bold'
                            : 'text-[#0d1f15] hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            src={m.avatarUrl}
                            name={m.fullName}
                            className="w-7 h-7 rounded-full text-[11px]"
                            iconClassName="w-3.5 h-3.5"
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

                  <div className="border-t border-slate-100 pt-1 mt-1 px-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowMemberMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#0d1f15] hover:bg-[#e5e9d3] rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4 text-[#0a452b]" />
                      My Profile Page
                    </button>
                    <button
                      onClick={() => {
                        setShowMemberMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      Log Out
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
