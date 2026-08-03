'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import {
  User,
  Mail,
  Camera,
  Upload,
  Check,
  ShieldCheck,
  Users,
  Key,
  RefreshCw,
  Sliders,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    currentFamily,
    familyMembers,
    updateUserProfile,
    updateUserGeminiApiKey,
    getActiveGeminiApiKeyInfo,
    setActiveTab,
  } = useApp();

  const currentMember = familyMembers.find((m) => m.userId === currentUser?.id);
  const isAdmin = currentMember?.role === 'Admin';

  const [fullNameInput, setFullNameInput] = useState(currentUser?.fullName || '');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(currentUser?.avatarUrl || '');
  const [geminiKeyInput, setGeminiKeyInput] = useState(currentUser?.geminiApiKey || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const [savedMsg, setSavedMsg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync inputs when currentUser changes
  const [prevUserId, setPrevUserId] = useState(currentUser?.id);
  if (currentUser?.id !== prevUserId) {
    setPrevUserId(currentUser?.id);
    setFullNameInput(currentUser?.fullName || '');
    setEmailInput(currentUser?.email || '');
    setAvatarUrlInput(currentUser?.avatarUrl || '');
    setGeminiKeyInput(currentUser?.geminiApiKey || '');
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 4MB');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrlInput(dataUrl);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    try {
      setErrorMsg(null);
      await updateUserProfile({
        fullName: fullNameInput.trim(),
        email: emailInput.trim(),
        avatarUrl: avatarUrlInput.trim(),
      });

      if (geminiKeyInput.trim() !== (currentUser?.geminiApiKey || '')) {
        await updateUserGeminiApiKey(geminiKeyInput.trim());
      }

      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setErrorMsg(message);
    }
  };

  if (!currentUser) return null;

  const activeKeyInfo = getActiveGeminiApiKeyInfo();

  return (
    <div id="profile-page-container" className="py-6 pb-10 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0d1f15] tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#0a452b]" />
            Your Profile & Preferences
          </h1>
          <p className="text-xs text-slate-600">
            Manage your personal information, avatar, and individual API keys
          </p>
        </div>
        <button
          onClick={() => setActiveTab('family')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d5dbcb] text-xs font-bold text-[#0a452b] hover:bg-[#f2f5e8] shadow-xs transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          Family Workspace
        </button>
      </div>

      {/* Main Profile Summary Card */}
      <div className="p-6 rounded-[24px] bg-gradient-to-br from-[#0a452b] to-[#07331f] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          {/* Avatar Display */}
          <div className="relative group shrink-0">
            <UserAvatar
              src={avatarUrlInput || currentUser.avatarUrl}
              name={currentUser.fullName}
              className="w-20 h-20 rounded-2xl text-2xl"
              iconClassName="w-8 h-8"
            />
            <label
              htmlFor="avatar-file-input"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-white text-[#0a452b] flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Upload new photo"
            >
              <Camera className="w-4 h-4" />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* User Meta */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-bold">{currentUser.fullName}</h2>
              {isAdmin ? (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-[#0a452b] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Family Admin
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Family Member
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-emerald-300" />
              {currentUser.email}
            </p>
            {currentFamily && (
              <p className="text-[11px] text-emerald-200/80 pt-1">
                Workspace: <span className="font-semibold text-white">{currentFamily.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0d1f15] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0a452b]" />
            Personal Details
          </h2>
          {savedMsg && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved Successfully!
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0d1f15] block">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#0d1f15] block">Email Address</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
              required
            />
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-[#0d1f15] block">Profile Picture</label>

          <div className="flex items-center gap-3">
            <UserAvatar
              src={avatarUrlInput}
              name={fullNameInput}
              className="w-12 h-12 rounded-2xl text-lg"
              iconClassName="w-5 h-5"
            />

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="avatar-file-input-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#d5dbcb] text-xs font-bold text-[#0a452b] hover:bg-[#e5e9d3] cursor-pointer shadow-2xs transition-colors"
              >
                {isUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Upload Photo</span>
                <input
                  id="avatar-file-input-btn"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {avatarUrlInput ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrlInput('')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 shadow-2xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              ) : null}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Upload your personal profile picture (JPG, PNG or WEBP, max 4MB). If no photo is uploaded, default white & grey initials avatar will be shown.
          </p>
        </div>

        {/* Gemini API Key Section */}
        <div className="p-4 rounded-2xl bg-white border border-[#d5dbcb] space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#0d1f15] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#0a452b]" />
                Personal Gemini API Key
              </p>
              <p className="text-[11px] text-slate-500">
                Setup your own key for OCR receipt scanning. Overrides family shared key.
              </p>
            </div>
            {currentUser.geminiApiKey ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                Personal Key Configured
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                Using {activeKeyInfo.source === 'family' ? 'Family Key' : 'No Key'}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="AIzaSy... (Personal Gemini API Key)"
              className="w-full px-3.5 py-2 pr-16 text-xs font-mono bg-[#f8faf6] border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 hover:text-[#0d1f15]"
            >
              {showGeminiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
};
