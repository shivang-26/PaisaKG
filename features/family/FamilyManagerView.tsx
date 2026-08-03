'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
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
  ArrowLeft,
  X,
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
    updateFamilyGeminiApiKey,
    getActiveGeminiApiKeyInfo,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Gemini API Key State
  const [familyKeyInput, setFamilyKeyInput] = useState(currentFamily?.geminiApiKey || '');
  const [showFamilyKey, setShowFamilyKey] = useState(false);
  const [familyKeySavedMsg, setFamilyKeySavedMsg] = useState(false);

  // Sync initial inputs when active family shifts
  const [prevFamilyId, setPrevFamilyId] = useState(currentFamily?.id);
  if (currentFamily?.id !== prevFamilyId) {
    setPrevFamilyId(currentFamily?.id);
    setFamilyKeyInput(currentFamily?.geminiApiKey || '');
  }

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
          <h1 className="text-xl font-extrabold text-[#0d1f15] tracking-tight">
            Family Workspace Settings
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Manage members, invite code, budget & system options
          </p>
        </div>

        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      {/* Family Card Banner or No Family Setup Banner */}
      {currentFamily ? (
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
      ) : (
        <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#f2f5e8] via-white to-[#e5e9d3] border-2 border-[#0a452b]/30 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0a452b] text-emerald-300 flex items-center justify-center font-bold text-xl shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0d1f15]">
                Setup Your Family Workspace
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Create a new family to become Family Admin or join an existing family using invite code.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-4 rounded-2xl bg-[#0a452b] hover:bg-[#07331f] text-white text-left transition-all shadow-md group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold">Create New Family</p>
              <p className="text-xs text-emerald-100/80">You will be assigned as Family Admin</p>
            </button>

            <button
              onClick={() => setShowJoinModal(true)}
              className="p-4 rounded-2xl bg-white hover:bg-[#f2f5e8] text-[#0d1f15] border border-[#d5dbcb] text-left transition-all shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-[#0d1f15]">Join Family via Code</p>
              <p className="text-xs text-slate-500">Enter invite code shared by family admin</p>
            </button>
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="p-6 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0d1f15] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0a452b]" /> Family Members ({familyMembers.length})
            </h2>
            <p className="text-xs text-slate-600">
              All members can contribute and view expenses
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </button>
          )}
        </div>

        <div className="space-y-2">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="p-3 rounded-2xl bg-white border border-[#d5dbcb] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  src={member.avatarUrl}
                  name={member.fullName}
                  className="w-9 h-9 rounded-full text-xs"
                  iconClassName="w-4 h-4"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0d1f15] text-xs">
                      {member.fullName}
                    </p>
                    {member.userId === currentUser?.id && (
                      <span className="text-[10px] font-extrabold text-[#0a452b] bg-[#e5e9d3] px-1.5 py-0.5 rounded border border-[#d5dbcb]">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    member.role === 'Admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-[#e5e9d3] text-slate-700 border border-[#d5dbcb]'
                  }`}
                >
                  {member.role}
                </span>

                {isAdmin && member.userId !== currentUser?.id && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
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
          className="p-4 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] hover:border-[#0a452b] text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-[#0d1f15]">Join Another Family</p>
          <p className="text-[10px] text-slate-500">Enter invite code</p>
        </button>

        <button
          onClick={() => setShowCreateModal(true)}
          className="p-4 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] hover:border-[#0a452b] text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-[#e5e9d3] text-[#0a452b] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-[#0d1f15]">Create New Family</p>
          <p className="text-[10px] text-slate-500">Start fresh workspace</p>
        </button>
      </div>

      {/* App Preferences & Offline Monitor */}
      <div className="p-5 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
          Preferences & System
        </h2>

        <div className="space-y-2 text-xs">
          {/* Offline Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#d5dbcb]">
            <div className="flex items-center gap-2">
              {isOffline ? <WifiOff className="w-4 h-4 text-amber-600" /> : <Wifi className="w-4 h-4 text-[#0a452b]" />}
              <div>
                <p className="font-bold text-[#0d1f15]">Offline Engine Status</p>
                <p className="text-[10px] text-slate-500">
                  {isOffline ? 'Working Offline (IndexedDB Active)' : 'Online (Auto-sync ready)'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#0a452b]">
              {syncQueueCount} pending
            </span>
          </div>

          {/* Export Data CSV */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#d5dbcb]">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#0a452b]" />
              <span className="font-bold text-[#0d1f15]">Export CSV File</span>
            </div>
            <button
              onClick={() => exportExpensesCSV(expenses, currentFamily?.name || 'Family')}
              className="px-3 py-1 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white font-bold text-[11px]"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Gemini AI API Key Setup Section */}
      <div className="p-6 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0d1f15] flex items-center gap-2">
                Family Gemini AI Key Setup
              </h2>
              <p className="text-xs text-slate-600">
                Configure a shared family key for receipt scanning & AI features
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-[#0a452b] border border-emerald-300">
            OCR & AI Ready
          </span>
        </div>

        {/* Family Shared Gemini API Key Card (Family Admin) */}
        <div className="p-4 rounded-2xl bg-[#e5e9d3]/70 border border-[#d5dbcb] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#0d1f15] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0a452b]" />
                Family Shared Gemini API Key {isAdmin ? '(Admin Controls)' : '(Family Shared)'}
              </p>
              <p className="text-[11px] text-slate-600">
                Shared key used by all family members who haven&apos;t set a personal key.
              </p>
            </div>
            {currentFamily?.geminiApiKey ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#0a452b] border border-emerald-300 shrink-0">
                Shared Key Active
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                No family key set
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type={showFamilyKey ? 'text' : 'password'}
                    value={familyKeyInput}
                    onChange={(e) => setFamilyKeyInput(e.target.value)}
                    placeholder="AIzaSy... (Shared for entire family)"
                    className="w-full px-3 py-2 pr-16 text-xs font-mono bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFamilyKey(!showFamilyKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-[#0d1f15]"
                  >
                    {showFamilyKey ? 'Hide' : 'Show'}
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await updateFamilyGeminiApiKey(familyKeyInput);
                      setFamilyKeySavedMsg(true);
                      setTimeout(() => setFamilyKeySavedMsg(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold transition-all shrink-0"
                  >
                    Save Family Key
                  </button>
                  {currentFamily?.geminiApiKey && (
                    <button
                      type="button"
                      onClick={async () => {
                        setFamilyKeyInput('');
                        await updateFamilyGeminiApiKey('');
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {familyKeySavedMsg && (
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Family shared Gemini API key saved!
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-[#d5dbcb]">
              {currentFamily?.geminiApiKey ? (
                <span className="font-semibold text-[#0a452b]">
                  ✓ Your Family Admin has configured a shared key for the family.
                </span>
              ) : (
                <span className="text-slate-500">
                  No family-wide key configured yet. Ask your Family Admin to add one or enter your personal key above.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* INVITE MEMBER FULL PAGE */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Add Family Member
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Invite to shared budget workspace
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            {/* Quick Share Code Banner inside Invite Modal */}
            {currentFamily && (
              <div className="p-4 rounded-2xl bg-white border border-[#d5dbcb] flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0a452b]">
                    Share Family Code directly
                  </p>
                  <p className="text-base font-bold tracking-widest font-mono text-[#0d1f15] mt-0.5">
                    {currentFamily.inviteCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-[#0a452b] text-white text-xs font-bold hover:bg-[#07331f] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            )}

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#d5dbcb] w-full"></div>
              <span className="bg-[#e5e9d3] px-3 text-[10px] uppercase font-bold text-slate-500 shrink-0">
                Or Add by Email
              </span>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-[#d5dbcb] shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="family.member@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Siya Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Member')}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                >
                  <option value="Member">Member (Can log & view expenses)</option>
                  <option value="Admin">Admin (Can edit family & invite)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-700 border border-[#d5dbcb] rounded-xl hover:bg-[#e5e9d3] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold bg-[#0a452b] hover:bg-[#07331f] text-white rounded-xl shadow-xs transition-all"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FAMILY FULL PAGE */}
      {showEditFamilyModal && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEditFamilyModal(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <Edit2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Edit Family Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update family name and budget limit
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditFamilyModal(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full">
            <form onSubmit={handleEditFamilySubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-[#d5dbcb] shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Budget Limit (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditFamilyModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-700 border border-[#d5dbcb] rounded-xl hover:bg-[#e5e9d3] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold bg-[#0a452b] hover:bg-[#07331f] text-white rounded-xl shadow-xs transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN FAMILY FULL PAGE */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Join Family Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect with family invite code
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            <p className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-[#d5dbcb]">
              Enter the invite code shared by your family admin. You can enter it with or without the &quot;FAM-&quot; prefix.
            </p>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleJoinFamily} className="space-y-4 bg-white p-5 rounded-2xl border border-[#d5dbcb] shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invite Code (e.g. FAM-SH7890 or SH7890)
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FAM-SH7890"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-700 border border-[#d5dbcb] rounded-xl hover:bg-[#e5e9d3] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold bg-[#0a452b] hover:bg-[#07331f] text-white rounded-xl shadow-xs transition-all"
                >
                  Join Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FAMILY FULL PAGE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Create New Family Workspace
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Start a dedicated budget group
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full">
            <form onSubmit={handleCreateFamily} className="space-y-4 bg-white p-5 rounded-2xl border border-[#d5dbcb] shadow-2xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  value={newFamName}
                  onChange={(e) => setNewFamName(e.target.value)}
                  placeholder="e.g. Kapoor Family"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Target Budget (₹)
                </label>
                <input
                  type="number"
                  value={newFamBudget}
                  onChange={(e) => setNewFamBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-700 border border-[#d5dbcb] rounded-xl hover:bg-[#e5e9d3] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold bg-[#0a452b] hover:bg-[#07331f] text-white rounded-xl shadow-xs transition-all"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
