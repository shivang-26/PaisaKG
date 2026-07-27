'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/constants';
import { Expense, ExpenseCategoryKey } from '@/lib/types';
import { formatAmount, formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
  Receipt,
  X,
  FileText,
  Trash2,
  Edit,
  Share2,
  Calendar,
  User,
  Plus,
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
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface ExpenseListProps {
  selectedExpense: Expense | null;
  onSelectExpense: (expense: Expense | null) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  selectedExpense,
  onSelectExpense,
  onOpenAddModal,
  onOpenScanModal,
}) => {
  const { expenses, familyMembers, deleteExpense, updateExpense, currentFamily } =
    useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<ExpenseCategoryKey>('Groceries');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  // Filter expenses logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Search
      const matchSearch =
        searchQuery === '' ||
        e.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.createdByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchCategory =
        selectedCategory === 'ALL' || e.category === selectedCategory;

      // Member filter
      const matchMember =
        selectedMember === 'ALL' || e.createdBy === selectedMember;

      // Month filter
      const matchMonth =
        selectedMonth === 'ALL' || e.expenseDate.startsWith(selectedMonth);

      return matchSearch && matchCategory && matchMember && matchMonth;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMember, selectedMonth]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleStartEdit = (exp: Expense) => {
    setEditMerchant(exp.merchant);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
    setEditDate(exp.expenseDate);
    setEditNotes(exp.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    await updateExpense(selectedExpense.id, {
      merchant: editMerchant,
      amount: Number(editAmount),
      category: editCategory,
      expenseDate: editDate,
      notes: editNotes,
    });
    setIsEditing(false);
    onSelectExpense(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this expense?')) {
      await deleteExpense(id);
      onSelectExpense(null);
    }
  };

  const handleShare = (exp: Expense) => {
    const text = `Family Expense: ${exp.merchant} - ${formatAmount(exp.amount, exp.currency)} (${exp.category}) paid by ${exp.createdByName} on ${exp.expenseDate}`;
    if (navigator.share) {
      navigator.share({ title: 'Expense Summary', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied expense summary to clipboard!');
    }
  };

  return (
    <div id="expense-list-view" className="space-y-4 pb-20 pt-2">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#0d1f15] tracking-tight">
            Family Expense Records
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Showing {filteredExpenses.length} expenses • Total:{' '}
            <span className="font-bold text-[#0a452b]">
              {formatAmount(totalFilteredAmount, currentFamily?.currency || '₹')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanModal}
            className="px-4 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Scan Receipt
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#f2f5e8] border border-[#d5dbcb] text-[#0a452b] text-xs font-semibold hover:bg-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, notes, member..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#f2f5e8] border border-[#d5dbcb] rounded-2xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
            showFilters || selectedCategory !== 'ALL' || selectedMember !== 'ALL'
              ? 'bg-[#0a452b] text-white border-[#07331f]'
              : 'bg-[#f2f5e8] border-[#d5dbcb] text-[#0d1f15]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
        </button>
      </div>

      {/* Expandable Filter Drawer */}
      {showFilters && (
        <div className="p-4 bg-[#f2f5e8] rounded-3xl border border-[#d5dbcb] space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15]"
              >
                <option value="ALL">All Categories</option>
                {Object.values(CATEGORIES).map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Family Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15]"
              >
                <option value="ALL">All Family Members</option>
                {familyMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedMember('ALL');
                  setSearchQuery('');
                }}
                className="w-full py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense List Items */}
      {filteredExpenses.length > 0 ? (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => {
            const catInfo = CATEGORIES[expense.category] || CATEGORIES.Others;
            const IconComp = getCategoryIcon(catInfo.iconName);

            return (
              <div
                key={expense.id}
                onClick={() => onSelectExpense(expense)}
                className="p-3.5 rounded-2xl bg-[#f2f5e8] border border-[#d5dbcb] hover:border-[#0a452b] shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm"
                    style={{ backgroundColor: catInfo.color }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#0d1f15] truncate">
                        {expense.merchant}
                      </p>
                      {expense.receiptImage && (
                        <span className="p-1 rounded bg-[#e5e9d3] text-[#0a452b] text-[10px]" title="Receipt photo attached">
                          <FileText className="w-3 h-3 text-[#0a452b]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-800">
                        {expense.createdByName}
                      </span>
                      <span>•</span>
                      <span>{formatDate(expense.expenseDate)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-[#0d1f15] group-hover:text-[#0a452b] transition-colors">
                    {formatAmount(expense.amount, expense.currency)}
                  </p>
                  <span className="inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    {expense.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No expenses found
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Try adjusting search terms or filters to find family expenses.
          </p>
        </div>
      )}

      {/* EXPENSE DETAIL & EDIT LIGHTBOX MODAL */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isEditing ? 'Edit Expense' : 'Expense Details'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID: {selectedExpense.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectExpense(null);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {isEditing ? (
                /* EDIT FORM */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Merchant
                    </label>
                    <input
                      type="text"
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ExpenseCategoryKey)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {Object.values(CATEGORIES).map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                /* VIEW DISPLAY */
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                    <p className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Amount Paid
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {formatAmount(selectedExpense.amount, selectedExpense.currency)}
                    </p>
                    <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold mt-2">
                      {selectedExpense.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <p className="text-slate-400 font-medium">Merchant</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedExpense.merchant}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <p className="text-slate-400 font-medium">Date</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {formatDate(selectedExpense.expenseDate)}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <p className="text-slate-400 font-medium">Paid By</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedExpense.createdByName}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                      <p className="text-slate-400 font-medium">Sync Status</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedExpense.synced ? 'Synced to Cloud' : 'Saved Offline'}
                      </p>
                    </div>
                  </div>

                  {selectedExpense.notes && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
                      <p className="text-slate-400 font-medium">Notes</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedExpense.notes}
                      </p>
                    </div>
                  )}

                  {/* Line Items if available */}
                  {selectedExpense.items && selectedExpense.items.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Line Items Breakdown ({selectedExpense.items.length})
                      </p>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                        {selectedExpense.items.map((item, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.name} {item.qty ? `x${item.qty}` : ''}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ₹{item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Receipt Image Preview */}
                  {selectedExpense.receiptImage && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Attached Receipt Image
                      </p>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
                        <img
                          src={selectedExpense.receiptImage}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(selectedExpense)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleShare(selectedExpense)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(selectedExpense.id)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
