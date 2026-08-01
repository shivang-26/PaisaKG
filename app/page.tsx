'use client';

import React, { useState, useRef } from 'react';
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
import { compressImage } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

function MainApp() {
  const { currentUser, isLoading, activeTab, setActiveTab } = useApp();

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
    setScanModalConfig({ isOpen: true, initialMode: mode });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e5e9d3] text-[#0d1f15] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0a452b] flex items-center justify-center text-white text-2xl font-bold shadow-md animate-pulse mb-3">
          ₹
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0a452b]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0a452b]" />
          <span>Loading PaisaKG Tracker...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#e5e9d3] text-[#0d1f15] font-sans transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pb-28 min-h-[calc(100vh-4rem-4rem)]">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenScanModal={handleOpenScanModal}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onSelectExpense={(expense) => {
              setSelectedExpense(expense);
              setActiveTab('expenses');
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseList
            selectedExpense={selectedExpense}
            onSelectExpense={setSelectedExpense}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanModal={handleOpenScanModal}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'family' && <FamilyManagerView />}

        {activeTab === 'profile' && <ProfileView />}
      </main>

      <BottomNav onOpenScanModal={() => handleOpenScanModal('camera')} />

      {/* Flagship OCR Receipt Scan Modal */}
      <ScanReceiptModal
        isOpen={scanModalConfig.isOpen}
        initialMode={scanModalConfig.initialMode}
        onClose={() =>
          setScanModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Manual Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
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
