'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/constants';
import { ExpenseCategoryKey } from '@/lib/types';
import { compressImage, triggerHaptic } from '@/lib/utils';
import {
  X,
  PlusCircle,
  AlertCircle,
  Upload,
  Receipt,
  Check,
  Calendar,
  DollarSign,
  Tag,
  Store,
  User,
  ArrowLeft,
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, currentFamily, familyMembers, addExpense, setActiveTab } = useApp();

  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategoryKey>('Groceries');
  const [merchant, setMerchant] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id || '');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 800);
      setReceiptImage(base64);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Amount must be greater than zero');
      return;
    }
    if (!merchant.trim()) {
      setErrorMsg('Please specify merchant or store name');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const paidByMember = familyMembers.find((m) => m.userId === paidByUserId);
      const paidByName = paidByMember ? paidByMember.fullName : (currentUser?.fullName || 'Family Member');

      await addExpense({
        amount: Number(amount),
        currency: '₹',
        category,
        merchant: merchant.trim(),
        expenseDate,
        createdBy: paidByUserId || currentUser?.id || 'usr_default',
        createdByName: paidByName,
        notes: notes.trim(),
        receiptImage: receiptImage || undefined,
      });

      triggerHaptic([30, 50, 30]);
      resetForm();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('Groceries');
    setMerchant('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setReceiptImage(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                Add New Expense
              </h2>
              <p className="text-[11px] text-slate-500">
                Log manual transaction to family workspace
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            resetForm();
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Full-Page Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
          {!currentFamily && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <p className="text-xs font-bold">No Active Family Workspace</p>
              <p className="text-[11px] text-amber-800">
                You must create or join a family workspace before logging expenses.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveTab('family');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0a452b] text-white text-xs font-bold hover:bg-[#07331f] transition-all"
              >
                Go to Family Setup
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Box */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#0a452b] mb-1">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-2xl font-black text-[#0a452b]">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2 text-2xl font-black bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Merchant */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-500" /> Merchant / Store *
              </label>
              <input
                type="text"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Reliance Fresh"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" /> Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
              >
                {Object.values(CATEGORIES).map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Expense Date *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
              />
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> Paid By *
              </label>
              <select
                value={paidByUserId}
                onChange={(e) => setPaidByUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
              >
                {familyMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly milk, veggies and snacks"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-[#0d1f15] focus:outline-none focus:ring-4 focus:ring-[#0a452b]/10 focus:border-[#0a452b] transition-all"
            />
          </div>

          {/* Optional Receipt Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Photo (Optional)
            </label>
            {receiptImage ? (
              <div className="relative w-32 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <img src={receiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReceiptImage(null)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2.5 p-3.5 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-700 font-medium">
                  Attach receipt picture
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Expense
            </button>
          </div>
        </form>
    </div>
  );
};
