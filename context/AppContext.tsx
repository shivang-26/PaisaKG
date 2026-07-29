'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  activeTab: 'dashboard' | 'expenses' | 'scan' | 'reports' | 'family';
  setActiveTab: (tab: 'dashboard' | 'expenses' | 'scan' | 'reports' | 'family') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // Supabase Status
  hasSupabase: boolean;
  // Auth & Family Actions
  loginWithEmail: (email: string, otpCode: string, fullName?: string) => Promise<boolean>;
  sendOtp: (email: string, isSignUp?: boolean) => Promise<{ success: boolean; code?: string; error?: string }>;
  verifyOtp: (email: string, code: string, fullName?: string, isSignUp?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (email: string, pass: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchActiveUser: (userId: string) => Promise<void>;
  createFamily: (name: string, monthlyBudget?: number) => Promise<string>;
  joinFamily: (inviteCode: string) => Promise<boolean>;
  updateFamilyBudget: (budget: number) => Promise<void>;
  updateFamilyName: (name: string) => Promise<void>;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'scan' | 'reports' | 'family'>('dashboard');
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

    // Find family membership
    const memberRec = await db.family_members.where('userId').equals(user.id).first();
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
  ): Promise<{ success: boolean; code?: string; error?: string }> => {
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

    const res = await sendCustomOtp(cleanEmail);
    return { success: true, code: res.code };
  };

  const loginWithPassword = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.toLowerCase().trim();

    if (hasSupabase) {
      const res = await signInWithSupabasePassword(cleanEmail, pass);
      if (!res.success) {
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
        return { success: false, error: res.error || 'Sign up failed' };
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

  const joinFamily = async (inviteCode: string): Promise<boolean> => {
    if (!currentUser) throw new Error('Must be logged in');
    const targetFamily = await db.families.where('inviteCode').equalsIgnoreCase(inviteCode.trim()).first();
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
        createFamily,
        joinFamily,
        updateFamilyBudget,
        updateFamilyName,
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
