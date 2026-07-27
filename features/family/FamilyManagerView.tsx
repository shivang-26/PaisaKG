'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { exportExpensesCSV, formatAmount } from '@/lib/utils';
import {
  Users,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Edit2,
  ShieldCheck,
  Building2,
  Download,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Sparkles,
  Bot,
  Key,
  Plus,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export const FamilyManagerView: React.FC = () => {
  const {
    currentUser,
    currentFamily,
    familyMembers,
    expenses,
    updateFamilyBudget,
    updateFamilyName,
    inviteMember,
    removeMember,
    createFamily,
    joinFamily,
    isOffline,
    syncQueueCount,
    darkMode,
    toggleDarkMode,
    logout,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');

  // Edit Family State
  const [editName, setEditName] = useState(currentFamily?.name || '');
  const [editBudget, setEditBudget] = useState(currentFamily?.monthlyBudget || 75000);

  // Join/Create State
  const [joinCode, setJoinCode] = useState('');
  const [newFamName, setNewFamName] = useState('');
  const [newFamBudget, setNewFamBudget] = useState(50000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser && familyMembers.some(
    (m) => m.userId === currentUser.id && m.role === 'Admin'
  );

  const handleCopyCode = () => {
    if (!currentFamily) return;
    navigator.clipboard.writeText(currentFamily.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteMember(inviteEmail, inviteName, inviteRole);
    setInviteEmail('');
    setInviteName('');
    setShowInviteModal(false);
  };

  const handleEditFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      await updateFamilyName(editName.trim());
    }
    await updateFamilyBudget(Number(editBudget));
    setShowEditFamilyModal(false);
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const success = await joinFamily(joinCode.trim());
    if (success) {
      setJoinCode('');
      setShowJoinModal(false);
    } else {
      setErrorMsg('Invalid invite code. Please check and try again.');
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamName.trim()) return;
    await createFamily(newFamName.trim(), Number(newFamBudget));
    setNewFamName('');
    setShowCreateModal(false);
  };

  return (
    <div id="family-manager-view" className="space-y-6 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Family Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Manage members, invite code, budget & system options
          </p>
        </div>

        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      {/* Family Card Banner */}
      {currentFamily && (
        <div className="p-6 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0a452b] text-white flex items-center justify-center font-bold text-xl shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0d1f15]">
                  {currentFamily.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Monthly Budget:{' '}
                  <span className="font-bold text-[#0d1f15]">
                    {formatAmount(currentFamily.monthlyBudget || 75000, currentFamily.currency)}
                  </span>
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setEditName(currentFamily.name);
                  setEditBudget(currentFamily.monthlyBudget || 75000);
                  setShowEditFamilyModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#d5dbcb] text-[#0a452b] text-xs font-semibold hover:bg-[#e5e9d3] transition-colors flex items-center gap-1 shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {/* Unique Invite Code Banner */}
          <div className="p-4 rounded-2xl bg-[#e5e9d3] border border-[#d5dbcb] flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0a452b]">
                Family Invite Code
              </p>
              <p className="text-base font-bold tracking-widest font-mono text-[#0d1f15]">
                {currentFamily.inviteCode}
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-[#0a452b] text-white border border-[#07331f] text-xs font-bold hover:bg-[#07331f] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white" /> Copy Code
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#16A34A]" /> Family Members ({familyMembers.length})
            </h2>
            <p className="text-xs text-slate-400">
              All members can contribute and view expenses
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white text-xs font-semibold shadow-lg shadow-green-100 dark:shadow-none transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </button>
          )}
        </div>

        <div className="space-y-2">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={member.avatarUrl || 'https://picsum.photos/100'}
                  alt={member.fullName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {member.fullName}
                    </p>
                    {member.userId === currentUser?.id && (
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    member.role === 'Admin'
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {member.role}
                </span>

                {isAdmin && member.userId !== currentUser?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Switch or Join Other Family Options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowJoinModal(true)}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Join Another Family</p>
          <p className="text-[10px] text-slate-400">Enter invite code</p>
        </button>

        <button
          onClick={() => setShowCreateModal(true)}
          className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">Create New Family</p>
          <p className="text-[10px] text-slate-400">Start fresh workspace</p>
        </button>
      </div>

      {/* App Preferences & Offline Monitor */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Preferences & System
        </h2>

        <div className="space-y-2 text-xs">
          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="font-bold text-slate-900 dark:text-white">Dark Theme</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                darkMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Offline Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {isOffline ? <WifiOff className="w-4 h-4 text-amber-500" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Offline Engine Status</p>
                <p className="text-[10px] text-slate-400">
                  {isOffline ? 'Working Offline (IndexedDB Active)' : 'Online (Auto-sync ready)'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {syncQueueCount} pending
            </span>
          </div>

          {/* Export Data CSV */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 dark:text-white">Export CSV File</span>
            </div>
            <button
              onClick={() => exportExpensesCSV(expenses, currentFamily?.name || 'Family')}
              className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px]"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Future AI Configuration Placeholder Architecture */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Future AI Configuration</h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            Architecture Ready
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Future expansion module for custom AI providers (Google Gemini, OpenAI, Anthropic, OpenRouter). API keys belong exclusively to the end user and will never be stored on application servers.
        </p>
      </div>

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Invite Family Member
            </h3>
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family.member@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Siya Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Member')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="Member">Member (Can log & view expenses)</option>
                  <option value="Admin">Admin (Can edit family & invite)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FAMILY MODAL */}
      {showEditFamilyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edit Family Workspace
            </h3>
            <form onSubmit={handleEditFamilySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Budget Limit (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditFamilyModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN FAMILY MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Join Family with Invite Code
            </h3>
            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}
            <form onSubmit={handleJoinFamily} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Invite Code (e.g. FAM-SH7890)
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="FAM-XXXXXX"
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow"
                >
                  Join Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FAMILY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Family Workspace
            </h3>
            <form onSubmit={handleCreateFamily} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  value={newFamName}
                  onChange={(e) => setNewFamName(e.target.value)}
                  placeholder="e.g. Kapoor Family"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Target Budget (₹)
                </label>
                <input
                  type="number"
                  value={newFamBudget}
                  onChange={(e) => setNewFamBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow"
                >
                  Create Family
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
