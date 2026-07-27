'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { CATEGORIES } from '@/lib/constants';
import { Expense } from '@/lib/types';
import { formatAmount, formatDate } from '@/lib/utils';
import {
  ScanLine,
  PlusCircle,
  Receipt,
  TrendingUp,
  Wallet,
  Calendar,
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
  FileText,
  User,
  PieChart,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenScanModal: () => void;
  onOpenAddModal: () => void;
  onSelectExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenScanModal,
  onOpenAddModal,
  onSelectExpense,
}) => {
  const { currentUser, currentFamily, familyMembers, expenses, setActiveTab } =
    useApp();

  // Calculate current month's expenses
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthExpenses = expenses.filter((e) =>
    e.expenseDate.startsWith(currentMonthStr)
  );

  const totalMonthlySpent = currentMonthExpenses.reduce(
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
  const todaySpent = expenses
    .filter((e) => e.expenseDate === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Category summary breakdown
  const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const formattedMonthYear = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div id="dashboard-view" className="space-y-6 pb-20 pt-4">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top Header Area */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-slate-600 text-xs sm:text-sm font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#0a452b]" /> {formattedMonthYear}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1f15]">
            {currentFamily ? currentFamily.name : 'Family Workspace'}
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id="dashboard-header-scan-btn"
            onClick={onOpenScanModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#f2f5e8] border border-[#d5dbcb] px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0a452b] shadow-sm hover:bg-white transition-colors"
          >
            <ScanLine className="w-4 h-4 text-[#0a452b]" />
            Scan Receipt
          </button>
          <button
            id="dashboard-header-add-btn"
            onClick={onOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0a452b] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:bg-[#07331f] transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Spent */}
        <div className="bg-[#f2f5e8] p-6 rounded-[24px] border border-[#d5dbcb] shadow-sm">
          <p className="text-sm font-medium text-slate-600 mb-2">Total Spent</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0d1f15]">
              {formatAmount(totalMonthlySpent, currentFamily?.currency || '₹')}
            </h3>
            <span className="text-xs text-[#0a452b] bg-[#e5e9d3] px-2.5 py-0.5 rounded-full font-semibold border border-[#d5dbcb]">
              {budgetPercentage}% of Budget
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Budget */}
        <div className="bg-[#f2f5e8] p-6 rounded-[24px] border border-[#d5dbcb] shadow-sm">
          <p className="text-sm font-medium text-slate-600 mb-2">Monthly Budget</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0d1f15]">
              {formatAmount(budget, currentFamily?.currency || '₹')}
            </h3>
            <span className="text-xs text-slate-500">
              {formatAmount(remainingBudget, currentFamily?.currency || '₹')} left
            </span>
          </div>
          <div className="w-full h-2 bg-[#e5e9d3] rounded-full mt-4 overflow-hidden border border-[#d5dbcb]/50">
            <div
              className="h-full bg-[#0a452b] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Today's Spending */}
        <div className="bg-[#f2f5e8] p-6 rounded-[24px] border border-[#d5dbcb] shadow-sm relative overflow-hidden">
          <p className="text-sm font-medium text-slate-600 mb-2">Today&apos;s Spending</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#0d1f15]">
            {formatAmount(todaySpent, currentFamily?.currency || '₹')}
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            {familyMembers.length} active contributors
          </p>
        </div>
      </div>

      {/* Recent Expenses & Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Expenses (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col bg-[#f2f5e8] rounded-[24px] border border-[#d5dbcb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d5dbcb] flex justify-between items-center">
            <h4 className="font-bold text-[#0d1f15] flex items-center gap-2 text-sm">
              <Receipt className="w-4 h-4 text-[#0a452b]" /> Recent Expenses
            </h4>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-bold text-[#0a452b] uppercase tracking-wide hover:underline"
            >
              View All ({expenses.length})
            </button>
          </div>
          <div className="p-6">
            {expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense) => {
                  const catInfo = CATEGORIES[expense.category] || CATEGORIES.Others;
                  const IconComp = getCategoryIcon(catInfo.iconName);

                  return (
                    <div
                      key={expense.id}
                      onClick={() => onSelectExpense(expense)}
                      className="flex items-center justify-between p-4 bg-[#e5e9d3]/70 rounded-2xl border border-[#d5dbcb] hover:bg-[#e5e9d3] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-semibold shadow-sm"
                          style={{ backgroundColor: catInfo.color }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0d1f15] truncate">
                            {expense.merchant}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {expense.category} • {formatDate(expense.expenseDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-[#0d1f15]">
                          {formatAmount(expense.amount, expense.currency)}
                        </p>
                        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
                          {expense.createdByName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#e5e9d3]/50 rounded-2xl border border-[#d5dbcb]">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0d1f15]">No expenses recorded yet</p>
                <p className="text-xs text-slate-600 mb-4">Start by scanning a receipt or logging manually.</p>
                <button
                  onClick={onOpenScanModal}
                  className="px-4 py-2 rounded-xl bg-[#0a452b] text-white text-xs font-bold shadow-sm hover:bg-[#07331f]"
                >
                  Scan First Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Activity (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Category Breakdown */}
          <div className="bg-[#f2f5e8] p-6 rounded-[24px] border border-[#d5dbcb] shadow-sm">
            <h4 className="font-bold text-[#0d1f15] mb-4 text-sm flex items-center justify-between">
              <span>Categories</span>
              <button
                onClick={() => setActiveTab('reports')}
                className="text-xs font-bold text-[#0a452b] hover:underline"
              >
                Reports
              </button>
            </h4>
            <div className="space-y-4">
              {topCategories.length > 0 ? (
                topCategories.map(([catKey, amount]) => {
                  const catInfo = CATEGORIES[catKey as keyof typeof CATEGORIES] || CATEGORIES.Others;
                  const percentage = totalMonthlySpent > 0 ? Math.round((amount / totalMonthlySpent) * 100) : 0;

                  return (
                    <div key={catKey}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-700 font-medium">{catInfo.name}</span>
                        <span className="font-bold text-[#0d1f15]">
                          {formatAmount(amount, currentFamily?.currency || '₹')} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#e5e9d3] rounded-full overflow-hidden border border-[#d5dbcb]/40">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: catInfo.color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-2">No category data available for this month.</p>
              )}
            </div>
          </div>

          {/* Family Activity */}
          <div className="bg-[#f2f5e8] p-6 rounded-[24px] border border-[#d5dbcb] shadow-sm flex-1">
            <h4 className="font-bold text-[#0d1f15] mb-4 text-sm">Family Activity</h4>
            <div className="space-y-3">
              {expenses.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#e5e9d3] text-[#0a452b] flex items-center justify-center font-bold text-xs shrink-0 border border-[#d5dbcb]">
                    {e.createdByName.charAt(0)}
                  </div>
                  <div className="text-xs leading-tight min-w-0">
                    <p className="font-medium text-slate-700">
                      <span className="font-bold text-[#0d1f15]">{e.createdByName}</span> logged{' '}
                      <span className="font-bold text-[#0a452b]">
                        {formatAmount(e.amount, e.currency)}
                      </span>{' '}
                      at {e.merchant}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(e.expenseDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
