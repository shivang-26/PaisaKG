'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { CATEGORIES } from '@/lib/constants';
import { exportExpensesCSV, formatAmount } from '@/lib/utils';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Receipt,
  Download,
  Users,
  Store,
  DollarSign,
  Calendar,
  Award,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { expenses, currentFamily, familyMembers, selectedMonthFilter, setSelectedMonthFilter } = useApp();

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedMonthFilter === 'ALL') return true;
      return e.expenseDate.startsWith(selectedMonthFilter);
    });
  }, [expenses, selectedMonthFilter]);

  // Key metrics
  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  const expenseCount = currentMonthExpenses.length;
  const avgExpense = expenseCount > 0 ? Math.round(totalSpent / expenseCount) : 0;
  const highestExpense = useMemo(() => {
    if (expenseCount === 0) return 0;
    return Math.max(...currentMonthExpenses.map((e) => e.amount));
  }, [currentMonthExpenses, expenseCount]);

  // Category Pie Chart Data
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    return Object.entries(categoryTotals).map(([catKey, val]) => ({
      name: CATEGORIES[catKey as keyof typeof CATEGORIES]?.name || catKey,
      value: val,
      color: CATEGORIES[catKey as keyof typeof CATEGORIES]?.color || '#16A34A',
    }));
  }, [currentMonthExpenses]);

  // Spender Breakdown Data
  const spenderData = useMemo(() => {
    const totals: Record<string, { name: string; amount: number; count: number }> = {};
    currentMonthExpenses.forEach((e) => {
      if (!totals[e.createdBy]) {
        totals[e.createdBy] = { name: e.createdByName, amount: 0, count: 0 };
      }
      totals[e.createdBy].amount += e.amount;
      totals[e.createdBy].count += 1;
    });

    return Object.values(totals).sort((a, b) => b.amount - a.amount);
  }, [currentMonthExpenses]);

  // Top Merchants
  const topMerchants = useMemo(() => {
    const totals: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      totals[e.merchant] = (totals[e.merchant] || 0) + e.amount;
    });

    return Object.entries(totals)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentMonthExpenses]);

  // 6-Month Historical Trend Data
  const monthlyHistoryData = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; name: string }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
      months.push({ key, name });
    }

    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.expenseDate && e.expenseDate.length >= 7) {
        const key = e.expenseDate.slice(0, 7);
        totals[key] = (totals[key] || 0) + e.amount;
      }
    });

    return months.map((m) => ({
      monthKey: m.key,
      name: m.name,
      amount: totals[m.key] || 0,
      isSelected: selectedMonthFilter === m.key,
    }));
  }, [expenses, selectedMonthFilter]);

  // Daily Spending Trend Data
  const dailyTrendData = useMemo(() => {
    const now = new Date();
    const daysMap: Record<string, number> = {};
    // Last 14 days
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      daysMap[dayStr] = 0;
    }

    expenses.forEach((e) => {
      if (daysMap[e.expenseDate] !== undefined) {
        daysMap[e.expenseDate] += e.amount;
      }
    });

    return Object.entries(daysMap).map(([dateStr, amount]) => {
      const d = new Date(dateStr);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        amount,
      };
    });
  }, [expenses]);

  return (
    <div id="reports-view" className="space-y-6 pb-20 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0d1f15] tracking-tight">
            Family Analytics & Reports
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Month-wise spending breakdown & history for {currentFamily?.name || 'Workspace'}
          </p>
        </div>

        <button
          onClick={() => exportExpensesCSV(expenses, currentFamily?.name || 'Family')}
          className="px-4 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Monthly Trend Comparison Bar (Past 6 Months) */}
      <div className="p-5 rounded-[24px] bg-white border border-[#d5dbcb] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0d1f15] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#0a452b]" />
              Month-by-Month Spending History
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any month bar to filter reports for that specific month
            </p>
          </div>
        </div>

        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e9d3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [formatAmount(Number(val) || 0, currentFamily?.currency || '₹'), 'Total Spent']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #d5dbcb', backgroundColor: '#ffffff', fontSize: '12px' }}
              />
              <Bar
                dataKey="amount"
                fill="#0a452b"
                radius={[8, 8, 0, 0]}
                onClick={(entry: any) => {
                  if (entry && entry.monthKey) {
                    setSelectedMonthFilter(entry.monthKey);
                  }
                }}
                className="cursor-pointer hover:opacity-85 transition-opacity"
              >
                {monthlyHistoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isSelected ? '#15803d' : '#0a452b'}
                    opacity={entry.isSelected ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Total Spent
          </p>
          <p className="text-lg sm:text-2xl font-bold text-[#0d1f15] mt-1">
            {formatAmount(totalSpent, currentFamily?.currency || '₹')}
          </p>
          <p className="text-[10px] text-[#0a452b] font-semibold mt-1">
            This Month
          </p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            No. of Expenses
          </p>
          <p className="text-lg sm:text-2xl font-bold text-[#0d1f15] mt-1">
            {expenseCount}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Logged entries
          </p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Average Expense
          </p>
          <p className="text-lg sm:text-2xl font-bold text-[#0d1f15] mt-1">
            {formatAmount(avgExpense, currentFamily?.currency || '₹')}
          </p>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Per transaction
          </p>
        </div>

        <div className="p-5 rounded-[24px] bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Highest Expense
          </p>
          <p className="text-lg sm:text-2xl font-bold text-[#0d1f15] mt-1">
            {formatAmount(highestExpense, currentFamily?.currency || '₹')}
          </p>
          <p className="text-[10px] text-amber-700 font-semibold mt-1">
            Single largest
          </p>
        </div>
      </div>

      {/* Recharts Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Pie Chart */}
        <div className="p-5 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a452b] flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-[#0a452b]" /> Category Share
          </h2>

          {categoryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatAmount(Number(value), currentFamily?.currency || '₹'),
                      'Spent',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend Badges */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {categoryData.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0d1f15]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-10 text-center">
              No category data available.
            </p>
          )}
        </div>

        {/* Daily Spending Bar Chart */}
        <div className="p-5 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a452b] flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#0a452b]" /> 14-Day Spending Trend
          </h2>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [
                    formatAmount(Number(value), currentFamily?.currency || '₹'),
                    'Daily Total',
                  ]}
                />
                <Bar dataKey="amount" fill="#0a452b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Spenders & Top Merchants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Family Spenders */}
        <div className="p-5 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a452b] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0a452b]" /> Top Family Spenders
          </h2>

          <div className="space-y-2">
            {spenderData.map((spender, idx) => {
              const memberObj = familyMembers.find((m) => m.fullName === spender.name);
              const percent = totalSpent > 0 ? Math.round((spender.amount / totalSpent) * 100) : 0;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-[#d5dbcb] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      src={memberObj?.avatarUrl}
                      name={spender.name}
                      className="w-8 h-8 rounded-full text-xs"
                      iconClassName="w-3.5 h-3.5"
                    />
                    <div>
                      <p className="font-bold text-[#0d1f15]">
                        {spender.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {spender.count} expenses ({percent}% of family total)
                      </p>
                    </div>
                  </div>

                  <p className="font-black text-[#0d1f15] text-sm">
                    {formatAmount(spender.amount, currentFamily?.currency || '₹')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Merchants */}
        <div className="p-5 rounded-3xl bg-[#f2f5e8] border border-[#d5dbcb] shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a452b] flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#0a452b]" /> Top Merchants
          </h2>

          <div className="space-y-2">
            {topMerchants.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white border border-[#d5dbcb] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#e5e9d3] text-[#0a452b] flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <span className="font-bold text-[#0d1f15]">
                    {item.merchant}
                  </span>
                </div>

                <p className="font-black text-[#0d1f15] text-sm">
                  {formatAmount(item.amount, currentFamily?.currency || '₹')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
