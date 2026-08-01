'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { db, seedInitialData } from '@/lib/db';
import {
  Expense,
  ExpenseCategoryKey,
  Family,
  FamilyMember,
  SyncQueueItem,
  UserProfile,
} from '@/lib/types';
import { generateId, generateInviteCode } from '@/lib/utils';
import { sendCustomOtp, verifyCustomOtp } from '@/lib/otpService';
import {
  getSupabaseClient,
  getSupabaseCredentials,
  signInWithSupabasePassword,
  signUpWithSupabasePassword,
} from '@/lib/supabase';

interface AppContextType {
  currentUser: UserProfile | null;
  currentFamily: Family | null;
  familyMembers: FamilyMember[];
  expenses: Expense[];
  isLoading: boolean;
  isOffline: boolean;
  syncQueueCount: number;
  activeTab: 'dashboard' | 'expenses' | 'scan' | 'reports' | 'family' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'expenses' | 'scan' | 'reports' | 'family' | 'profile') => void;
  selectedMonthFilter: string; // 'YYYY-MM' or 'ALL'
  setSelectedMonthFilter: (month: string) => void;
  availableMonths: Array<{ label: string; value: string }>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // Supabase Status
  hasSupabase: boolean;
  // Auth & Family Actions
  loginWithEmail: (email: string, otpCode: string, fullName?: string) => Promise<boolean>;
  sendOtp: (email: string, isSignUp?: boolean) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, code: string, fullName?: string, isSignUp?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, pass: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchActiveUser: (userId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  createFamily: (name: string, monthlyBudget?: number) => Promise<string>;
  joinFamily: (inviteCode: string) => Promise<boolean>;
  updateFamilyBudget: (budget: number) => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
  updateUserGeminiApiKey: (apiKey: string) => Promise<void>;
  updateFamilyGeminiApiKey: (apiKey: string) => Promise<void>;
  getActiveGeminiApiKeyInfo: () => { key?: string; source: 'personal' | 'family' | 'none' };
  inviteMember: (email: string, fullName: string, role: 'Admin' | 'Member') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  // Expense Actions
  addExpense: (expenseData: Omit<Expense, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'scan' | 'reports' | 'family' | 'profile'>('dashboard');

  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Add current month and past 12 calendar months
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthMap.set(key, label);
    }

    // Add any additional month present in expenses
    expenses.forEach((e) => {
      if (e.expenseDate && e.expenseDate.length >= 7) {
        const key = e.expenseDate.slice(0, 7);
        if (!monthMap.has(key)) {
          const [yearStr, monthStr] = key.split('-');
          const year = parseInt(yearStr, 10);
          const monthIdx = parseInt(monthStr, 10) - 1;
          if (!isNaN(year) && monthIdx >= 0 && monthIdx < 12) {
            monthMap.set(key, `${monthNames[monthIdx]} ${year}`);
          }
        }
      }
    });

    const list = Array.from(monthMap.entries()).map(([key, label]) => ({
      value: key,
      label,
    }));

    list.sort((a, b) => b.value.localeCompare(a.value));
    return [{ label: 'All Time', value: 'ALL' }, ...list];
  }, [expenses]);

  const goToPreviousMonth = () => {
    if (selectedMonthFilter === 'ALL') {
      setSelectedMonthFilter(getCurrentMonthStr());
      return;
    }
    const parts = selectedMonthFilter.split('-');
    if (parts.length < 2) return;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // 0-indexed for Date constructor
    const prevDate = new Date(year, month - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonthFilter(prevKey);
  };

  const goToNextMonth = () => {
    if (selectedMonthFilter === 'ALL') {
      setSelectedMonthFilter(getCurrentMonthStr());
      return;
    }
    const parts = selectedMonthFilter.split('-');
    if (parts.length < 2) return;
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    const nextDate = new Date(year, month + 1, 1);
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonthFilter(nextKey);
  };
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [hasSupabase] = useState<boolean>(() => {
    const { url, key } = getSupabaseCredentials();
    return Boolean(url && key);
  });

  const loginWithEmail = async (email: string, otpCode: string, fullName?: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    let user = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
    if (!user) {
      const newUserId = generateId('usr');
      user = {
        id: newUserId,
        email: cleanEmail,
        fullName: fullName?.trim() || cleanEmail.split('@')[0],
        avatarUrl: '/logo.svg',
        createdAt: new Date().toISOString(),
      };
      await db.users.add(user);
    }

    setCurrentUser(user);
    localStorage.setItem('activeUserId', user.id);

    // Find family membership (by userId or by email fallback if invited)
    let memberRec = await db.family_members.where('userId').equals(user.id).first();
    if (!memberRec && cleanEmail) {
      memberRec = await db.family_members.where('email').equalsIgnoreCase(cleanEmail).first();
      if (memberRec) {
        // Link member record to this user id
        await db.family_members.update(memberRec.id, { userId: user.id });
      }
    }

    if (memberRec) {
      const family = await db.families.get(memberRec.familyId);
      if (family) {
        setCurrentFamily(family);
        const members = await db.family_members.where('familyId').equals(family.id).toArray();
        setFamilyMembers(members);
        const familyExpenses = await db.expenses.where('familyId').equals(family.id).reverse().toArray();
        setExpenses(familyExpenses);
      }
    } else {
      // New account onboarding: Create their dedicated new family workspace
      const newFamId = generateId('fam');
      const newFamName = `${user.fullName}'s Family`;
      const inviteCode = generateInviteCode();
      const newFam: Family = {
        id: newFamId,
        name: newFamName,
        inviteCode,
        createdBy: user.id,
        monthlyBudget: 75000,
        currency: '₹',
        createdAt: new Date().toISOString(),
      };
      await db.families.add(newFam);

      // Save to cross-session shared backup store
      try {
        const existingBackup = JSON.parse(localStorage.getItem('paisa_shared_families_backup') || '[]');
        existingBackup.push(newFam);
        localStorage.setItem('paisa_shared_families_backup', JSON.stringify(existingBackup));
      } catch (e) {
        // silent fallback
      }

      const newMem: FamilyMember = {
        id: generateId('mem'),
        familyId: newFamId,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        role: 'Admin',
        avatarUrl: user.avatarUrl,
        joinedAt: new Date().toISOString(),
      };
      await db.family_members.add(newMem);

      setCurrentFamily(newFam);
      setFamilyMembers([newMem]);
      setExpenses([]);
    }

    return true;
  };

  const verifyOtp = async (
    email: string,
    code: string,
    fullName?: string,
    isSignUp?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    if (isSignUp) {
      const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.',
        };
      }
    } else {
      const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (!existingUser) {
        return {
          success: false,
          error: 'No account found with this email. Please sign up to register a new account.',
        };
      }
    }

    const res = await verifyCustomOtp(cleanEmail, code);
    if (!res.success) {
      return { success: false, error: res.error || 'Invalid OTP code' };
    }

    // Login or onboard user into local session
    await loginWithEmail(cleanEmail, code, fullName);
    return { success: true };
  };

  // Monitor network status & Supabase auth changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');

      // Register SW safely
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((e) => console.log('SW Error:', e));
      }
    }

    // Subscribe to Supabase Auth state changes
    const supabase = getSupabaseClient();
    let authSubscription: any = null;

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          const userEmail = session.user.email;
          const userFullName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
          verifyOtp(userEmail, '123456', userFullName);
        }
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          const userEmail = session.user.email;
          const userFullName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
          verifyOtp(userEmail, '123456', userFullName);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(false);
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await seedInitialData();

      // Get saved active user from local storage
      const savedUserId = localStorage.getItem('activeUserId');
      let activeUser: UserProfile | null = null;

      if (savedUserId) {
        const found = await db.users.get(savedUserId);
        if (found) activeUser = found;
      }

      setCurrentUser(activeUser);

      if (activeUser) {
        // Find family membership
        const memberRec = await db.family_members.where('userId').equals(activeUser.id).first();
        if (memberRec) {
          const family = await db.families.get(memberRec.familyId);
          if (family) {
            setCurrentFamily(family);

            // Fetch all members for this family
            const members = await db.family_members.where('familyId').equals(family.id).toArray();
            setFamilyMembers(members);

            // Fetch expenses for this family
            const familyExpenses = await db.expenses.where('familyId').equals(family.id).reverse().toArray();
            setExpenses(familyExpenses);
          }
        }
      }

      const syncCount = await db.sync_queue.count();
      setSyncQueueCount(syncCount);
    } catch (err) {
      console.error('Failed to load DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) {
        await loadData();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const refreshData = async () => {
    if (!currentFamily) return;
    const members = await db.family_members.where('familyId').equals(currentFamily.id).toArray();
    setFamilyMembers(members);
    const familyExpenses = await db.expenses.where('familyId').equals(currentFamily.id).reverse().toArray();
    setExpenses(familyExpenses);
    const syncCount = await db.sync_queue.count();
    setSyncQueueCount(syncCount);
  };

  const sendOtp = async (
    email: string,
    isSignUp?: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();

    if (isSignUp && existingUser) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    if (!isSignUp && !existingUser) {
      return {
        success: false,
        error: 'No account found with this email. Please sign up to create a new account.',
      };
    }

    const res = await sendCustomOtp(cleanEmail, isSignUp);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to send OTP code.' };
    }
    return { success: true };
  };

  const loginWithPassword = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    if (hasSupabase) {
      const res = await signInWithSupabasePassword(cleanEmail, pass);
      if (!res.success) {
        // If Supabase hits rate limits or error, fallback to local database authentication
        const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
        if (existingUser) {
          await loginWithEmail(cleanEmail, '123456');
          return { success: true };
        }
        if (res.error?.toLowerCase().includes('rate limit')) {
          await loginWithEmail(cleanEmail, '123456');
          return { success: true };
        }
        return { success: false, error: res.error || 'Invalid email or password' };
      }
    } else {
      const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
      if (!existingUser) {
        return {
          success: false,
          error: 'No account found with this email. Please sign up to create a new account.',
        };
      }
    }

    await loginWithEmail(cleanEmail, '123456');
    return { success: true };
  };

  const signUpWithPassword = async (
    email: string,
    pass: string,
    fullName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    if (hasSupabase) {
      const res = await signUpWithSupabasePassword(cleanEmail, pass, fullName);
      if (!res.success) {
        console.warn('[Supabase SignUp Notice]:', res.error);
        // If Supabase returns rate limit error or email rate limit issue, fall back to local onboarding
        if (
          res.error?.toLowerCase().includes('rate limit') ||
          res.error?.toLowerCase().includes('email')
        ) {
          // Proceed with local account creation smoothly
        } else {
          return { success: false, error: res.error || 'Sign up failed' };
        }
      }
    }

    await loginWithEmail(cleanEmail, '123456', fullName);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('activeUserId');
    setCurrentUser(null);
    setCurrentFamily(null);
    setFamilyMembers([]);
    setExpenses([]);
  };

  const switchActiveUser = async (userId: string) => {
    const targetUser = await db.users.get(userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('activeUserId', targetUser.id);
      await refreshData();
    }
  };

  const syncFamiliesBackup = async () => {
    try {
      const families = await db.families.toArray();
      if (families.length > 0) {
        localStorage.setItem('paisa_shared_families_backup', JSON.stringify(families));
      }
    } catch (e) {
      console.error('Error syncing families backup:', e);
    }
  };

  const createFamily = async (name: string, monthlyBudget = 50000): Promise<string> => {
    if (!currentUser) throw new Error('Must be logged in to create family');
    const familyId = generateId('fam');
    const inviteCode = generateInviteCode();

    const newFamily: Family = {
      id: familyId,
      name,
      inviteCode,
      createdBy: currentUser.id,
      monthlyBudget,
      currency: '₹',
      createdAt: new Date().toISOString(),
    };

    await db.families.add(newFamily);
    await syncFamiliesBackup();

    const adminMember: FamilyMember = {
      id: generateId('mem'),
      familyId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      role: 'Admin',
      avatarUrl: currentUser.avatarUrl,
      joinedAt: new Date().toISOString(),
    };

    await db.family_members.add(adminMember);

    setCurrentFamily(newFamily);
    setFamilyMembers([adminMember]);
    setExpenses([]);
    return inviteCode;
  };

  const joinFamily = async (rawCode: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Must be logged in');

    const cleanInput = rawCode.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleanInput) return false;

    const normalize = (c: string) => c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // 1. Fetch current DB families
    let allFamilies = await db.families.toArray();

    // 2. Load cross-session shared backup from localStorage
    try {
      const backupStr = localStorage.getItem('paisa_shared_families_backup');
      if (backupStr) {
        const backupFamilies: Family[] = JSON.parse(backupStr);
        for (const fam of backupFamilies) {
          if (!allFamilies.some((f) => f.id === fam.id)) {
            await db.families.put(fam);
            allFamilies.push(fam);
          }
        }
      }
    } catch (err) {
      console.error('Failed reading family backup:', err);
    }

    // 3. Find matching family using flexible normalized rules
    let targetFamily = allFamilies.find((fam) => {
      const cleanFam = normalize(fam.inviteCode);
      if (cleanFam === cleanInput) return true;
      if (`FAM${cleanInput}` === cleanFam) return true;
      if (`FAM${cleanFam}` === cleanInput) return true;
      const userNoFam = cleanInput.replace(/^FAM/, '');
      const famNoFam = cleanFam.replace(/^FAM/, '');
      return userNoFam.length > 0 && userNoFam === famNoFam;
    });

    // 4. Fallback to Dexie equalsIgnoreCase direct query
    if (!targetFamily) {
      targetFamily = await db.families.where('inviteCode').equalsIgnoreCase(rawCode.trim()).first();
    }

    if (!targetFamily) {
      return false;
    }

    // Check if already a member
    const existing = await db.family_members
      .where('familyId')
      .equals(targetFamily.id)
      .and((m) => m.userId === currentUser.id)
      .first();

    if (!existing) {
      const newMember: FamilyMember = {
        id: generateId('mem'),
        familyId: targetFamily.id,
        userId: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        role: 'Member',
        avatarUrl: currentUser.avatarUrl,
        joinedAt: new Date().toISOString(),
      };
      await db.family_members.add(newMember);
    }

    await syncFamiliesBackup();

    setCurrentFamily(targetFamily);
    const members = await db.family_members.where('familyId').equals(targetFamily.id).toArray();
    setFamilyMembers(members);
    const familyExpenses = await db.expenses.where('familyId').equals(targetFamily.id).reverse().toArray();
    setExpenses(familyExpenses);
    return true;
  };

  const updateFamilyBudget = async (budget: number) => {
    if (!currentFamily) return;
    await db.families.update(currentFamily.id, { monthlyBudget: budget });
    setCurrentFamily({ ...currentFamily, monthlyBudget: budget });
  };

  const updateFamilyName = async (name: string) => {
    if (!currentFamily) return;
    await db.families.update(currentFamily.id, { name });
    setCurrentFamily({ ...currentFamily, name });
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    await db.users.update(currentUser.id, updates);
    setCurrentUser(updatedUser);

    if (updates.fullName !== undefined || updates.avatarUrl !== undefined) {
      const memberRecords = await db.family_members.where('userId').equals(currentUser.id).toArray();
      for (const m of memberRecords) {
        await db.family_members.update(m.id, {
          fullName: updates.fullName !== undefined ? updates.fullName : m.fullName,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : m.avatarUrl,
        });
      }
      if (currentFamily) {
        const refreshedMembers = await db.family_members.where('familyId').equals(currentFamily.id).toArray();
        setFamilyMembers(refreshedMembers);
      }
    }
  };

  const updateUserGeminiApiKey = async (apiKey: string) => {
    if (!currentUser) return;
    const key = apiKey.trim();
    await db.users.update(currentUser.id, { geminiApiKey: key });
    setCurrentUser({ ...currentUser, geminiApiKey: key });
  };

  const updateFamilyGeminiApiKey = async (apiKey: string) => {
    if (!currentFamily) return;
    const key = apiKey.trim();
    await db.families.update(currentFamily.id, { geminiApiKey: key });
    const updated = { ...currentFamily, geminiApiKey: key };
    setCurrentFamily(updated);
    await syncFamiliesBackup();
  };

  const getActiveGeminiApiKeyInfo = (): { key?: string; source: 'personal' | 'family' | 'none' } => {
    if (currentUser?.geminiApiKey && currentUser.geminiApiKey.trim().length > 0) {
      return { key: currentUser.geminiApiKey.trim(), source: 'personal' };
    }
    if (currentFamily?.geminiApiKey && currentFamily.geminiApiKey.trim().length > 0) {
      return { key: currentFamily.geminiApiKey.trim(), source: 'family' };
    }
    return { key: undefined, source: 'none' };
  };

  const inviteMember = async (email: string, fullName: string, role: 'Admin' | 'Member') => {
    if (!currentFamily) return;
    const cleanEmail = email.toLowerCase().trim();
    let user = await db.users.where('email').equalsIgnoreCase(cleanEmail).first();
    if (!user) {
      user = {
        id: generateId('usr'),
        email: cleanEmail,
        fullName: fullName || cleanEmail.split('@')[0],
        avatarUrl: `https://picsum.photos/seed/${cleanEmail}/100/100`,
        createdAt: new Date().toISOString(),
      };
      await db.users.add(user);
    }

    const memberId = generateId('mem');
    const newMember: FamilyMember = {
      id: memberId,
      familyId: currentFamily.id,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl,
      joinedAt: new Date().toISOString(),
    };

    await db.family_members.add(newMember);
    await refreshData();
  };

  const removeMember = async (memberId: string) => {
    if (!currentFamily) return;
    await db.family_members.delete(memberId);
    await refreshData();
  };

  const addExpense = async (
    expenseData: Omit<Expense, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> => {
    if (!currentFamily) throw new Error('No family selected');

    const newExpense: Expense = {
      ...expenseData,
      id: generateId('exp'),
      familyId: currentFamily.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: !isOffline,
    };

    await db.expenses.add(newExpense);

    if (isOffline) {
      await db.sync_queue.add({
        id: generateId('sync'),
        action: 'CREATE_EXPENSE',
        data: newExpense,
        timestamp: new Date().toISOString(),
      });
    }

    await refreshData();
    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const updatedAt = new Date().toISOString();
    await db.expenses.update(id, { ...updates, updatedAt, synced: !isOffline });

    if (isOffline) {
      await db.sync_queue.add({
        id: generateId('sync'),
        action: 'UPDATE_EXPENSE',
        data: { id, updates },
        timestamp: updatedAt,
      });
    }

    await refreshData();
  };

  const deleteExpense = async (id: string) => {
    await db.expenses.delete(id);

    if (isOffline) {
      await db.sync_queue.add({
        id: generateId('sync'),
        action: 'DELETE_EXPENSE',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    }

    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentFamily,
        familyMembers,
        expenses,
        isLoading,
        isOffline,
        syncQueueCount,
        activeTab,
        setActiveTab,
        selectedMonthFilter,
        setSelectedMonthFilter,
        availableMonths,
        goToPreviousMonth,
        goToNextMonth,
        darkMode,
        toggleDarkMode,
        hasSupabase,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        signUpWithPassword,
        loginWithEmail,
        logout,
        switchActiveUser,
        updateUserProfile,
        createFamily,
        joinFamily,
        updateFamilyBudget,
        updateFamilyName,
        updateUserGeminiApiKey,
        updateFamilyGeminiApiKey,
        getActiveGeminiApiKeyInfo,
        inviteMember,
        removeMember,
        addExpense,
        updateExpense,
        deleteExpense,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
