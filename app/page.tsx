'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { ExpenseList } from '@/features/expenses/ExpenseList';
import { ScanReceiptModal } from '@/features/expenses/ScanReceiptModal';
import { AddExpenseModal } from '@/features/expenses/AddExpenseModal';
import { ReportsView } from '@/features/reports/ReportsView';
import { FamilyManagerView } from '@/features/family/FamilyManagerView';
import { ProfileView } from '@/features/profile/ProfileView';
import { Expense } from '@/lib/types';
import { Sparkles, ShieldCheck, Wallet } from 'lucide-react';

const emptySubscribe = () => () => {};

function LoadingSplashScreen() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#e5e9d3] text-[#0d1f15] flex flex-col items-center justify-between p-8 select-none">
        <div className="w-full flex justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0a452b]/10 rounded-full text-[11px] font-semibold text-[#0a452b]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Offline-First</span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="relative mb-6">
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0a452b] to-[#125d3b] flex items-center justify-center text-white shadow-xl shadow-[#0a452b]/25 border border-white/20">
              <span className="text-4xl font-extrabold tracking-tight">₹</span>
              <div className="absolute -top-1 -right-1 text-yellow-300">
                <Sparkles className="w-5 h-5 fill-yellow-300" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-[#0d1f15] tracking-tight">PaisaKG</h1>
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-[#0a452b] text-white rounded-md">
                v2.0
              </span>
            </div>
            <p className="text-xs text-[#0a452b]/80 font-medium tracking-wide mb-6">
              Paisa Kha Gaya? Smart Family Expense Tracker
            </p>
          </div>

          <div className="w-48 h-1.5 bg-[#0a452b]/15 rounded-full overflow-hidden relative mb-3">
            <div className="w-full h-full bg-[#0a452b] rounded-full" />
          </div>

          <div className="text-[11px] font-semibold text-[#0a452b]/70 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Setting up your financial dashboard...</span>
          </div>
        </div>

        <div className="text-[10px] font-medium text-[#0a452b]/50 tracking-wider uppercase">
          Encrypted & Sync Enabled
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 bg-[#e5e9d3] text-[#0d1f15] flex flex-col items-center justify-between p-8 select-none"
    >
      <div className="w-full flex justify-end">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0a452b]/10 rounded-full text-[11px] font-semibold text-[#0a452b]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure Offline-First</span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center max-w-sm">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 22,
            delay: 0.1,
          }}
          className="relative mb-6"
        >
          {/* Glowing background ring */}
          <motion.div
            animate={{
              scale: [1, 1.18, 1],
              opacity: [0.25, 0.5, 0.25],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -inset-4 rounded-3xl bg-[#0a452b]/20 blur-xl"
          />

          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0a452b] to-[#125d3b] flex items-center justify-center text-white shadow-xl shadow-[#0a452b]/25 border border-white/20">
            <span className="text-4xl font-extrabold tracking-tight">₹</span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-1 -right-1 text-yellow-300"
            >
              <Sparkles className="w-5 h-5 fill-yellow-300" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-[#0d1f15] tracking-tight">PaisaKG</h1>
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold bg-[#0a452b] text-white rounded-md">
              v2.0
            </span>
          </div>
          <p className="text-xs text-[#0a452b]/80 font-medium tracking-wide mb-6">
            Paisa Kha Gaya? Smart Family Expense Tracker
          </p>
        </motion.div>

        {/* Smooth loading bar */}
        <div className="w-48 h-1.5 bg-[#0a452b]/15 rounded-full overflow-hidden relative mb-3">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: 'easeInOut',
            }}
            className="w-full h-full bg-[#0a452b] rounded-full"
          />
        </div>

        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[11px] font-semibold text-[#0a452b]/70 flex items-center gap-1.5"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Setting up your financial dashboard...</span>
        </motion.div>
      </div>

      <div className="text-[10px] font-medium text-[#0a452b]/50 tracking-wider uppercase">
        Encrypted & Sync Enabled
      </div>
    </motion.div>
  );
}

function MainApp() {
  const { currentUser, isLoading, activeTab, setActiveTab, expenses } = useApp();

  const [scanModalConfig, setScanModalConfig] = useState<{
    isOpen: boolean;
    initialMode: 'camera' | 'gallery';
  }>({
    isOpen: false,
    initialMode: 'camera',
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleOpenScanModal = (mode: 'camera' | 'gallery' = 'camera') => {
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { paisaApp: true, tab: activeTab, modal: 'scan', scanMode: mode },
        '',
        '#scan'
      );
    }
    setScanModalConfig({ isOpen: true, initialMode: mode });
  };

  const handleCloseScanModal = () => {
    if (typeof window !== 'undefined' && window.history.state?.modal === 'scan') {
      window.history.back();
    } else {
      setScanModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleOpenAddModal = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { paisaApp: true, tab: activeTab, modal: 'add' },
        '',
        '#add-expense'
      );
    }
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    if (typeof window !== 'undefined' && window.history.state?.modal === 'add') {
      window.history.back();
    } else {
      setIsAddModalOpen(false);
    }
  };

  const handleSelectExpense = (expense: Expense | null) => {
    if (expense) {
      setSelectedExpense(expense);
      setActiveTab('expenses');
      if (typeof window !== 'undefined') {
        window.history.pushState(
          { paisaApp: true, tab: 'expenses', modal: 'expense-detail', expenseId: expense.id },
          '',
          `#expense-${expense.id}`
        );
      }
    } else {
      if (typeof window !== 'undefined' && window.history.state?.modal === 'expense-detail') {
        window.history.back();
      } else {
        setSelectedExpense(null);
      }
    }
  };

  // Sync state with popstate (phone back button)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial history state if missing or untagged
    if (!window.history.state || !window.history.state.paisaApp) {
      window.history.replaceState(
        { paisaApp: true, tab: activeTab || 'dashboard', modal: null },
        '',
        `#${activeTab || 'dashboard'}`
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.paisaApp) {
        if (state.tab) {
          setActiveTab(state.tab);
        }

        if (state.modal === 'scan') {
          setScanModalConfig({
            isOpen: true,
            initialMode: state.scanMode || 'camera',
          });
        } else {
          setScanModalConfig((prev) => ({ ...prev, isOpen: false }));
        }

        if (state.modal === 'add') {
          setIsAddModalOpen(true);
        } else {
          setIsAddModalOpen(false);
        }

        if (state.modal === 'expense-detail' && state.expenseId) {
          const found = expenses.find((e) => e.id === state.expenseId);
          setSelectedExpense(found || null);
        } else {
          setSelectedExpense(null);
        }
      } else {
        // Fallback to home dashboard
        setActiveTab('dashboard');
        setScanModalConfig((prev) => ({ ...prev, isOpen: false }));
        setIsAddModalOpen(false);
        setSelectedExpense(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [expenses, setActiveTab, activeTab]);

  if (isLoading) {
    return <LoadingSplashScreen />;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#e5e9d3] text-[#0d1f15] font-sans transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pb-28 min-h-[calc(100vh-4rem-4rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenScanModal={handleOpenScanModal}
                onOpenAddModal={handleOpenAddModal}
                onSelectExpense={handleSelectExpense}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseList
                selectedExpense={selectedExpense}
                onSelectExpense={handleSelectExpense}
                onOpenAddModal={handleOpenAddModal}
                onOpenScanModal={handleOpenScanModal}
              />
            )}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'family' && <FamilyManagerView />}

            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav onOpenScanModal={() => handleOpenScanModal('camera')} />

      {/* Flagship OCR Receipt Scan Modal */}
      <ScanReceiptModal
        isOpen={scanModalConfig.isOpen}
        initialMode={scanModalConfig.initialMode}
        onClose={handleCloseScanModal}
      />

      {/* Manual Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
