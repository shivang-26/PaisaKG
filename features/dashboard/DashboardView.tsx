'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { CATEGORIES } from '@/lib/constants';
import { Expense } from '@/lib/types';
import { formatAmount, formatDate } from '@/lib/utils';
import {
  ScanLine,
  Upload,
  PlusCircle,
  Receipt,
  TrendingUp,
  Wallet,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Utensils,
  Fuel,
  Activity,
  Shirt,
  Zap,
  GraduationCap,
  Plane,
  Film,
  MoreHorizontal,
  PieChart,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenScanModal: (mode?: 'camera' | 'gallery') => void;
  onOpenAddModal: () => void;
  onSelectExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenScanModal,
  onOpenAddModal,
  onSelectExpense,
}) => {
  const {
    currentUser,
    currentFamily,
    familyMembers,
    expenses,
    setActiveTab,
    selectedMonthFilter,
  } = useApp();

  const getCurrentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const activeBudgetMonth = selectedMonthFilter === 'ALL' ? getCurrentMonthStr() : selectedMonthFilter;

  // Monthly budget calculation is strictly bound to the active target month
  const budgetMonthExpenses = expenses.filter((e) => {
    return e.expenseDate && e.expenseDate.startsWith(activeBudgetMonth);
  });

  const totalMonthlySpent = budgetMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const budget = currentFamily?.monthlyBudget || 75000;
  const budgetPercentage = Math.min(
    Math.round((totalMonthlySpent / budget) * 100),
    100
  );
  const remainingBudget = Math.max(0, budget - totalMonthlySpent);

  // Today's spending calculation
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayExpenses = expenses.filter((e) => e.expenseDate === todayStr);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Days remaining in month calculation
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(1, daysInMonth - currentDay);
  const dailyAllowance = Math.round(remainingBudget / daysLeft);

  // Category summary breakdown
  const categoryTotals = budgetMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const topCategoryName = topCategories.length > 0 ? CATEGORIES[topCategories[0][0] as keyof typeof CATEGORIES]?.name || topCategories[0][0] : null;

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return ShoppingBag;
      case 'Utensils': return Utensils;
      case 'Fuel': return Fuel;
      case 'Activity': return Activity;
      case 'Shirt': return Shirt;
      case 'Zap': return Zap;
      case 'GraduationCap': return GraduationCap;
      case 'Plane': return Plane;
      case 'Film': return Film;
      default: return MoreHorizontal;
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6 pb-20 pt-2">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Executive Welcome & Workspace Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#d5dbcb] shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0a452b] text-emerald-300 flex items-center justify-center font-bold text-lg shadow-md shrink-0 border border-[#0d1f15]/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#0d1f15] tracking-tight">
                {currentFamily ? currentFamily.name : 'Family Workspace'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-[#0a452b] text-[11px] font-bold border border-emerald-300/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0a452b]" /> Active Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Welcome back, <span className="font-bold text-slate-700">{currentUser?.fullName}</span> • {familyMembers.length} member{familyMembers.length > 1 ? 's' : ''} connected
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            id="dashboard-header-upload-btn"
            onClick={() => onOpenScanModal('gallery')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#f2f5e8] border border-[#d5dbcb] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#0a452b] shadow-2xs hover:bg-white transition-all active:scale-98"
          >
            <Upload className="w-4 h-4 text-[#0a452b]" />
            <span>Upload Receipt</span>
          </button>
          <button
            id="dashboard-header-add-btn"
            onClick={onOpenAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#0a452b] px-4 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md hover:bg-[#07331f] transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      {/* AI Smart Expense Insights Banner */}
      <div className="bg-gradient-to-r from-[#0a452b] via-[#07331f] to-[#0a452b] rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                Smart AI Insight
              </span>
              <span className="text-[11px] text-emerald-200/80 font-medium">Updated live</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {budgetPercentage < 75 ? (
                <>You are pacing safely on track with <span className="text-emerald-300 font-extrabold">{formatAmount(remainingBudget, currentFamily?.currency || '₹')}</span> remaining buffer.</>
              ) : budgetPercentage < 90 ? (
                <>Caution: You have utilized <span className="text-amber-300 font-extrabold">{budgetPercentage}%</span> of your monthly allowance.</>
              ) : (
                <>Budget Alert: Spending is at <span className="text-rose-300 font-extrabold">{budgetPercentage}%</span> of allocated limit.</>
              )}
            </h2>

            <p className="text-xs text-emerald-100/80 leading-relaxed">
              {topCategoryName ? (
                <>Highest expenditure this period is in <strong className="text-white font-bold">{topCategoryName}</strong>. Recommended daily burn allowance is <strong className="text-emerald-300 font-bold">{formatAmount(dailyAllowance, currentFamily?.currency || '₹')}/day</strong> for the remaining {daysLeft} days.</>
              ) : (
                <>Scan or log expenses to receive personalized AI budget recommendations and cashflow analytics.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onOpenScanModal('camera')}
              className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#0a452b] text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-[#0a452b]" />
              <span>Scan Camera</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Spent */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#d5dbcb] shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spent</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0a452b] flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0d1f15] tracking-tight">
              {formatAmount(totalMonthlySpent, currentFamily?.currency || '₹')}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${
                budgetPercentage > 90
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-[#0a452b] border-emerald-200'
              }`}>
                {budgetPercentage}% of Budget
              </span>
              <span className="text-[11px] text-slate-500 font-medium">{budgetMonthExpenses.length} transactions</span>
            </div>
          </div>
        </div>

        {/* Card 2: Monthly Budget & Allowance */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#d5dbcb] shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Budget</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl sm:text-3xl font-black text-[#0d1f15] tracking-tight">
                {formatAmount(budget, currentFamily?.currency || '₹')}
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {formatAmount(remainingBudget, currentFamily?.currency || '₹')} left
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetPercentage > 90 ? 'bg-rose-500' : budgetPercentage > 75 ? 'bg-amber-500' : 'bg-[#0a452b]'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Today's Spending */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#d5dbcb] shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Velocity</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0d1f15] tracking-tight">
              {formatAmount(todaySpent, currentFamily?.currency || '₹')}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {familyMembers.slice(0, 3).map((m) => (
                  <UserAvatar
                    key={m.id}
                    src={m.avatarUrl}
                    name={m.fullName}
                    className="w-5 h-5 rounded-full text-[9px] ring-2 ring-white"
                    iconClassName="w-2.5 h-2.5"
                  />
                ))}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {todayExpenses.length} transaction{todayExpenses.length !== 1 ? 's' : ''} today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Expenses (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col bg-white rounded-3xl border border-[#d5dbcb] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d5dbcb] bg-[#f9faf6] flex justify-between items-center">
            <h4 className="font-extrabold text-[#0d1f15] flex items-center gap-2 text-xs uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-[#0a452b]" /> Recent Expenses
            </h4>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-bold text-[#0a452b] hover:underline flex items-center gap-1"
            >
              <span>View All ({expenses.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-5">
            {expenses.length > 0 ? (
              <div className="space-y-2.5">
                {expenses.slice(0, 5).map((expense) => {
                  const catInfo = CATEGORIES[expense.category] || CATEGORIES.Others;
                  const IconComp = getCategoryIcon(catInfo.iconName);

                  return (
                    <div
                      key={expense.id}
                      onClick={() => onSelectExpense(expense)}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#d5dbcb] hover:border-[#0a452b]/40 hover:bg-[#f8faf2] cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold shadow-2xs group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: catInfo.color }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0d1f15] truncate group-hover:text-[#0a452b] transition-colors">
                            {expense.merchant}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                            <span className="font-medium text-slate-600">{expense.category}</span>
                            <span>•</span>
                            <span>{formatDate(expense.expenseDate)}</span>
                            {expense.receiptImage && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                Receipt
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-sm text-[#0d1f15]">
                          {formatAmount(expense.amount, expense.currency)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {expense.createdByName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#f9faf6] rounded-2xl border border-dashed border-[#d5dbcb] space-y-3">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-[#0d1f15]">No expenses logged yet</p>
                  <p className="text-xs text-slate-500 mt-1">Start by scanning a receipt photo or logging an expense manually.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenScanModal('gallery')}
                  className="px-4 py-2 rounded-xl bg-[#0a452b] text-white text-xs font-bold shadow-sm hover:bg-[#07331f] transition-colors"
                >
                  Upload First Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Activity (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Category Breakdown Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#d5dbcb] shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-[#0d1f15] text-xs uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#0a452b]" /> Top Categories
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-[#0a452b] hover:underline"
              >
                Analytics Reports
              </button>
            </div>
            <div className="space-y-3.5">
              {topCategories.length > 0 ? (
                topCategories.map(([catKey, amount]) => {
                  const catInfo = CATEGORIES[catKey as keyof typeof CATEGORIES] || CATEGORIES.Others;
                  const percentage = totalMonthlySpent > 0 ? Math.round((amount / totalMonthlySpent) * 100) : 0;

                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-bold">{catInfo.name}</span>
                        <span className="font-black text-[#0d1f15]">
                          {formatAmount(amount, currentFamily?.currency || '₹')} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: catInfo.color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center italic">No category data recorded for this period.</p>
              )}
            </div>
          </div>

          {/* Family Activity Stream */}
          <div className="bg-white p-5 rounded-3xl border border-[#d5dbcb] shadow-2xs flex-1">
            <h4 className="font-extrabold text-[#0d1f15] text-xs uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0a452b]" /> Family Activity
            </h4>
            <div className="space-y-3">
              {expenses.slice(0, 4).map((e) => {
                const memberObj = familyMembers.find((m) => m.id === e.createdBy || m.fullName === e.createdByName);
                return (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f9faf6] transition-colors">
                    <UserAvatar
                      src={memberObj?.avatarUrl}
                      name={e.createdByName}
                      className="w-8 h-8 rounded-full text-xs shrink-0"
                      iconClassName="w-3.5 h-3.5"
                    />
                    <div className="text-xs leading-tight min-w-0 flex-1">
                      <p className="text-slate-700">
                        <span className="font-bold text-[#0d1f15]">{e.createdByName}</span> spent{' '}
                        <span className="font-black text-[#0a452b]">
                          {formatAmount(e.amount, e.currency)}
                        </span>{' '}
                        at <span className="font-semibold text-slate-800">{e.merchant}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(e.expenseDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
