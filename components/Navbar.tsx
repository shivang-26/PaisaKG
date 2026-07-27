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
    <header id="app-header" className="sticky top-0 z-30 bg-[#f2f5e8]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#d5dbcb] dark:border-slate-800 transition-colors">
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
              <span className="hidden md:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-700">
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800"
              title="Working Offline. Changes saved locally."
            >
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          ) : syncQueueCount > 0 ? (
            <div
              id="sync-status-badge"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-800"
            >
              <Wifi className="w-3.5 h-3.5 animate-spin" />
              <span className="text-[11px]">{syncQueueCount} syncing</span>
            </div>
          ) : null}

          {/* Dark mode toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Member Persona Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                id="user-persona-btn"
                onClick={() => setShowMemberMenu(!showMemberMenu)}
                className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={currentUser.avatarUrl || 'https://picsum.photos/100'}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline">
                  {currentUser.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Persona Dropdown */}
              {showMemberMenu && (
                <div
                  id="user-persona-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Family Member
                    </p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
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
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          m.userId === currentUser.id ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={m.avatarUrl || 'https://picsum.photos/100'}
                            alt={m.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-medium leading-tight">{m.fullName}</p>
                            <p className="text-[10px] text-slate-400">{m.role}</p>
                          </div>
                        </div>
                        {m.userId === currentUser.id && (
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 px-2">
                    <button
                      onClick={() => {
                        setActiveTab('family');
                        setShowMemberMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
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
