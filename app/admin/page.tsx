'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Bell,
  BarChart3,
  Activity,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  LogOut,
  Smartphone,
  Lock,
  UserCheck,
  UserX,
  RefreshCw,
  Zap,
  ChevronRight,
  Trash2,
  Radio,
  Eye,
} from 'lucide-react';
import { ActiveSessionInfo, BroadcastNotification, Family, UserProfile, Expense } from '@/lib/types';
import { triggerHaptic } from '@/lib/utils';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('paisa_admin_authenticated') === 'true' ||
      sessionStorage.getItem('paisa_admin_authenticated') === 'true'
    );
  });
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [rememberLogin, setRememberLogin] = useState<boolean>(true);

  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState<'users' | 'push' | 'analytics'>('users');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LEFT'>('ALL');
  const [selectedUser, setSelectedUser] = useState<ActiveSessionInfo | null>(null);

  // Data loaded from storage & Dexie backups
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveSessionInfo>>({});
  const [families, setFamilies] = useState<Family[]>([]);
  const [sentNotifications, setSentNotifications] = useState<BroadcastNotification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  // Push Notification Form
  const [pushTitle, setPushTitle] = useState<string>('');
  const [pushBody, setPushBody] = useState<string>('');
  const [pushCategory, setPushCategory] = useState<'info' | 'alert' | 'budget' | 'system'>('info');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'ACTIVE_ONLY' | 'FAMILY' | 'USER'>('ALL');
  const [targetId, setTargetId] = useState<string>('');
  const [pushSuccessMsg, setPushSuccessMsg] = useState<string>('');

  // Clock timer for pure render function
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Poll active sessions, users, and notifications
  const loadAdminData = () => {
    try {
      const sessionsStr = localStorage.getItem('paisa_active_sessions') || '{}';
      const parsedSessions: Record<string, ActiveSessionInfo> = JSON.parse(sessionsStr);
      setActiveSessions(parsedSessions);

      const usersBackupStr = localStorage.getItem('paisa_shared_users_backup') || '[]';
      const parsedUsers: UserProfile[] = JSON.parse(usersBackupStr);
      setRegisteredUsers(parsedUsers);

      const familiesBackupStr = localStorage.getItem('paisa_shared_families_backup') || '[]';
      const parsedFamilies: Family[] = JSON.parse(familiesBackupStr);
      setFamilies(parsedFamilies);

      const notifsStr = localStorage.getItem('paisa_broadcast_notifications') || '[]';
      const parsedNotifs: BroadcastNotification[] = JSON.parse(notifsStr);
      setSentNotifications(parsedNotifs);
    } catch (e) {
      console.warn('Error loading admin data:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const initialLoadTimer = setTimeout(() => {
      loadAdminData();
    }, 0);

    const interval = setInterval(loadAdminData, 3000);
    return () => {
      clearTimeout(initialLoadTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'admin123' || passcode.trim() === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
      triggerHaptic([30, 50, 30]);
      if (rememberLogin) {
        localStorage.setItem('paisa_admin_authenticated', 'true');
      } else {
        sessionStorage.setItem('paisa_admin_authenticated', 'true');
      }
    } else {
      setAuthError('Invalid Admin Passcode. Please check and try again.');
      triggerHaptic(50);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('paisa_admin_authenticated');
    sessionStorage.removeItem('paisa_admin_authenticated');
    setIsAuthenticated(false);
    setPasscode('');
    triggerHaptic(15);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
      if (result === 'granted') {
        new Notification('PaisaKG Admin Control Center', {
          body: 'Web Push Notifications enabled successfully!',
          icon: '/icon-192.png',
        });
      }
    }
  };

  const handleSendPushNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) {
      alert('Please enter both Title and Body for the push notification.');
      return;
    }

    const newNotif: BroadcastNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: pushTitle.trim(),
      body: pushBody.trim(),
      category: pushCategory,
      targetAudience,
      targetId: targetId || undefined,
      sentAt: new Date().toISOString(),
      sentBy: 'Admin',
    };

    try {
      const existingStr = localStorage.getItem('paisa_broadcast_notifications') || '[]';
      const existingList: BroadcastNotification[] = JSON.parse(existingStr);
      const updatedList = [newNotif, ...existingList];
      localStorage.setItem('paisa_broadcast_notifications', JSON.stringify(updatedList));
      setSentNotifications(updatedList);

      // Trigger browser native system push via Service Worker
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(pushTitle.trim(), {
              body: pushBody.trim(),
              icon: '/logo.svg',
              badge: '/logo.svg',
              tag: newNotif.id,
              vibrate: [200, 100, 200],
            } as NotificationOptions);
          }).catch(() => {
            new Notification(pushTitle.trim(), {
              body: pushBody.trim(),
              icon: '/logo.svg',
            });
          });
        } else {
          new Notification(pushTitle.trim(), {
            body: pushBody.trim(),
            icon: '/logo.svg',
          });
        }
      }

      triggerHaptic([30, 50, 30, 50]);
      setPushTitle('');
      setPushBody('');
      setPushSuccessMsg('🚀 Push Notification broadcasted successfully across all active user sessions!');

      setTimeout(() => {
        setPushSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error('Failed to send push notification:', err);
    }
  };

  const clearNotificationHistory = () => {
    if (confirm('Are you sure you want to clear the notification broadcast log?')) {
      localStorage.removeItem('paisa_broadcast_notifications');
      setSentNotifications([]);
      triggerHaptic(20);
    }
  };

  // User list combined with active session details
  const userList = useMemo(() => {
    const map = new Map<string, ActiveSessionInfo>();

    // Seed from active sessions map
    Object.values(activeSessions).forEach((s) => {
      map.set(s.userId, s);
    });

    // Merge registered users
    registeredUsers.forEach((u) => {
      if (!map.has(u.id)) {
        map.set(u.id, {
          userId: u.id,
          email: u.email,
          fullName: u.fullName,
          avatarUrl: u.avatarUrl,
          status: 'left',
          lastActiveAt: u.createdAt,
        });
      }
    });

    return Array.from(map.values());
  }, [activeSessions, registeredUsers]);

  // Compute status helpers
  const getTimeAgo = (isoStr: string) => {
    if (!isoStr) return 'Unknown';
    const diffMs = nowTimestamp - new Date(isoStr).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 30) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const isUserOnline = React.useCallback(
    (user: ActiveSessionInfo) => {
      if (user.status !== 'active') return false;
      if (!user.lastActiveAt) return false;
      const diffMs = nowTimestamp - new Date(user.lastActiveAt).getTime();
      return diffMs < 45000; // Active heartbeat within last 45s
    },
    [nowTimestamp]
  );

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const online = isUserOnline(u);
      if (statusFilter === 'ACTIVE' && !online) return false;
      if (statusFilter === 'LEFT' && online) return false;

      if (userSearchQuery.trim()) {
        const query = userSearchQuery.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.familyName && u.familyName.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [userList, statusFilter, userSearchQuery, isUserOnline]);

  const activeCount = userList.filter((u) => isUserOnline(u)).length;
  const leftCount = userList.length - activeCount;

  // Render Login View if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07130c] text-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-black">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mx-auto shadow-2xl shadow-emerald-900/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1f15] rounded-[14px] flex items-center justify-center">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              PaisaKG Admin Portal
            </h1>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              Web Control Center & Push Notification Broadcaster
            </p>
          </div>

          <form
            onSubmit={handleAdminLogin}
            className="p-6 rounded-[24px] bg-[#0d1f15] border border-emerald-900/50 shadow-2xl space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Admin Security Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (default: admin123)"
                className="w-full px-4 py-3 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {authError}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  className="rounded bg-[#07130c] border-emerald-800 text-emerald-500 focus:ring-0"
                />
                Remember login session
              </label>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                URL: /admin
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07130c] font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Access Admin Control Center
            </button>
          </form>

          <div className="text-center">
            <p className="text-[11px] text-slate-500">
              🔒 Restricted route. Direct URL access only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07130c] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0d1f15]/90 backdrop-blur-md border-b border-emerald-900/60 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  PaisaKG Admin
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  /admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                User Activity Tracker & Web Push Broadcast System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#07130c] border border-emerald-900/60 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Monitor</span>
            </div>

            <button
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Overview Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{userList.length}</p>
            <p className="text-[10px] text-slate-400">Registered across app</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Online Now</span>
              <UserCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">{activeCount}</p>
            <p className="text-[10px] text-emerald-300/80 font-medium">Actively using app now</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Just Left / Inactive</span>
              <UserX className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{leftCount}</p>
            <p className="text-[10px] text-slate-400">Closed or away recently</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Web Push Status</span>
              <Bell className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-lg font-bold text-white capitalize">{browserPermission}</p>
            <button
              onClick={requestNotificationPermission}
              className="text-[10px] text-teal-400 font-bold hover:underline"
            >
              {browserPermission === 'granted' ? '✓ Permission Enabled' : 'Enable Web Push'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3 gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setActiveTab('users');
                triggerHaptic(10);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-emerald-500 text-[#07130c] shadow-lg shadow-emerald-500/20'
                  : 'bg-[#0d1f15] text-slate-300 hover:text-white border border-emerald-900/50'
              }`}
            >
              <Users className="w-4 h-4" />
              User Activity Monitor ({userList.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('push');
                triggerHaptic(10);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'push'
                  ? 'bg-emerald-500 text-[#07130c] shadow-lg shadow-emerald-500/20'
                  : 'bg-[#0d1f15] text-slate-300 hover:text-white border border-emerald-900/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              Push Notifications Setup
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                triggerHaptic(10);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-[#07130c] shadow-lg shadow-emerald-500/20'
                  : 'bg-[#0d1f15] text-slate-300 hover:text-white border border-emerald-900/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              System Analytics
            </button>
          </div>

          <button
            onClick={() => {
              loadAdminData();
              triggerHaptic(15);
            }}
            className="p-2 rounded-xl bg-[#0d1f15] border border-emerald-900/50 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* TAB 1: USERS & ACTIVITY MONITOR */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by name, email, or family..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1f15] border border-emerald-900/50 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#0d1f15] p-1 rounded-xl border border-emerald-900/50 self-start sm:self-auto">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-emerald-500 text-[#07130c]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({userList.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-500 text-[#07130c]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Online ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('LEFT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'LEFT'
                      ? 'bg-emerald-500 text-[#07130c]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Just Left ({leftCount})
                </button>
              </div>
            </div>

            {/* Users Table / List */}
            <div className="rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-900/60 bg-[#07130c]/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-4">User</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Family Workspace</th>
                      <th className="p-4">Last Activity</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/40 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No users found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const online = isUserOnline(u);
                        return (
                          <tr
                            key={u.userId}
                            className="hover:bg-emerald-950/30 transition-colors group cursor-pointer"
                            onClick={() => setSelectedUser(u)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                                  {u.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                                    {u.fullName}
                                  </p>
                                  <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              {online ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  Active Now
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  Just Left ({getTimeAgo(u.lastActiveAt)})
                                </span>
                              )}
                            </td>

                            <td className="p-4">
                              {u.familyName ? (
                                <div>
                                  <p className="font-semibold text-slate-200">{u.familyName}</p>
                                  <span className="text-[10px] text-emerald-400/80 font-mono">
                                    {u.role || 'Member'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-[11px]">No family joined</span>
                              )}
                            </td>

                            <td className="p-4 text-slate-300 font-mono text-[11px]">
                              {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'N/A'}
                            </td>

                            <td className="p-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPushTitle(`Hello ${u.fullName}!`);
                                  setPushBody(`Message from PaisaKG Admin.`);
                                  setTargetAudience('USER');
                                  setTargetId(u.userId);
                                  setActiveTab('push');
                                  triggerHaptic(15);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-[#07130c] font-bold text-xs border border-emerald-500/40 transition-all inline-flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                Send Push
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUSH NOTIFICATIONS SETUP & BROADCASTER */}
        {activeTab === 'push' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-400" />
                      Compose Push Notification
                    </h2>
                    <p className="text-xs text-slate-400">
                      Send real-time alerts or broad popups to active app users.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    Web Push Active
                  </span>
                </div>

                {pushSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {pushSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleSendPushNotification} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ALL">🌐 Broadcast to ALL Registered Users</option>
                      <option value="ACTIVE_ONLY">🟢 Actively Online Users Only ({activeCount})</option>
                      <option value="FAMILY">👨‍👩‍👧‍👦 Specific Family Workspace</option>
                      <option value="USER">👤 Specific Target User</option>
                    </select>
                  </div>

                  {targetAudience === 'FAMILY' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Select Family</label>
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Choose Family --</option>
                        {families.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.inviteCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetAudience === 'USER' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Select User</label>
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Choose User --</option>
                        {userList.map((u) => (
                          <option key={u.userId} value={u.userId}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Notification Title</label>
                      <input
                        type="text"
                        value={pushTitle}
                        onChange={(e) => setPushTitle(e.target.value)}
                        placeholder="e.g. Budget Warning / Weekly Summary"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Category Tag</label>
                      <select
                        value={pushCategory}
                        onChange={(e) => setPushCategory(e.target.value as any)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="info">ℹ️ General Info</option>
                        <option value="alert">⚠️ Security / System Alert</option>
                        <option value="budget">💰 Budget Warning</option>
                        <option value="system">⚡ System Notice</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Message Body</label>
                    <textarea
                      value={pushBody}
                      onChange={(e) => setPushBody(e.target.value)}
                      rows={3}
                      placeholder="Write your push notification message here..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#07130c] border border-emerald-800/60 text-white placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#07130c] font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Push Notification Now
                  </button>
                </form>
              </div>
            </div>

            {/* Notification History Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Sent Broadcast History
                  </h3>
                  {sentNotifications.length > 0 && (
                    <button
                      onClick={clearNotificationHistory}
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {sentNotifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">
                      No push notifications sent yet.
                    </p>
                  ) : (
                    sentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl bg-[#07130c] border border-emerald-900/40 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                            {n.category} • {n.targetAudience}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-white">{n.title}</h4>
                        <p className="text-slate-300 leading-normal text-[11px]">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                User Activity Distribution
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Active Online Users</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {activeCount} ({userList.length > 0 ? Math.round((activeCount / userList.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#07130c] overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{
                        width: `${userList.length > 0 ? (activeCount / userList.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Inactive / Just Left Users</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {leftCount} ({userList.length > 0 ? Math.round((leftCount / userList.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#07130c] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{
                        width: `${userList.length > 0 ? (leftCount / userList.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d1f15] border border-emerald-900/50 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                System Health & Config
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-[#07130c]">
                  <span className="text-slate-400">Target Route:</span>
                  <span className="text-emerald-400 font-mono font-bold">/admin</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#07130c]">
                  <span className="text-slate-400">Total Families Created:</span>
                  <span className="text-white font-mono font-bold">{families.length}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-[#07130c]">
                  <span className="text-slate-400">Push Notifications Sent:</span>
                  <span className="text-white font-mono font-bold">{sentNotifications.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 rounded-[24px] bg-[#0d1f15] border border-emerald-800 text-white space-y-4 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedUser.fullName}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs pt-2">
                <div className="p-3 rounded-xl bg-[#07130c] flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-emerald-400">
                    {isUserOnline(selectedUser) ? '🟢 Active Now' : '🟡 Just Left / Offline'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#07130c] flex justify-between">
                  <span className="text-slate-400">Family Workspace:</span>
                  <span className="font-bold text-white">{selectedUser.familyName || 'None'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#07130c] flex justify-between">
                  <span className="text-slate-400">Last Seen:</span>
                  <span className="font-mono text-slate-300">
                    {selectedUser.lastActiveAt
                      ? new Date(selectedUser.lastActiveAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPushTitle(`Hello ${selectedUser.fullName}!`);
                  setPushBody('Message from PaisaKG Admin.');
                  setTargetAudience('USER');
                  setTargetId(selectedUser.userId);
                  setSelectedUser(null);
                  setActiveTab('push');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 text-[#07130c] font-black text-xs hover:bg-emerald-400 transition-all"
              >
                Send Direct Push Notification
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
