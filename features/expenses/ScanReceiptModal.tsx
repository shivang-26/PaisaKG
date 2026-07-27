'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { CATEGORIES } from '@/lib/constants';
import { ExpenseCategoryKey, OCRItemResult, OCRResult } from '@/lib/types';
import { compressImage } from '@/lib/utils';
import {
  Camera,
  Upload,
  X,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Receipt,
  Eye,
} from 'lucide-react';

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, familyMembers, addExpense } = useApp();

  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review Editable State
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategoryKey>('Groceries');
  const [expenseDate, setExpenseDate] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUser?.id || '');
  const [notes, setNotes] = useState('');
  const [confidenceScore, setConfidenceScore] = useState<number>(90);
  const [confidenceNotes, setConfidenceNotes] = useState<string>('');
  const [items, setItems] = useState<OCRItemResult[]>([]);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1000);
      setSelectedImage(base64);
      processOCR(base64);
    } catch (err) {
      setErrorMsg('Failed to process receipt image');
    }
  };

  const processOCR = async (imageBase64: string) => {
    setStep('scanning');
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze receipt');
      }

      // Populate review form with OCR findings
      const ocr: OCRResult = data;
      setMerchant(ocr.merchant || 'Store Merchant');
      setAmount(ocr.totalAmount || 0);
      setCategory(
        (CATEGORIES[ocr.category]?.key as ExpenseCategoryKey) || 'Groceries'
      );

      const validDate = ocr.date && !isNaN(new Date(ocr.date).getTime())
        ? ocr.date
        : new Date().toISOString().slice(0, 10);
      setExpenseDate(validDate);

      setConfidenceScore(ocr.confidenceScore || 85);
      setConfidenceNotes(ocr.confidenceNotes || '');
      setItems(ocr.items || []);
      setNotes(
        ocr.receiptNumber
          ? `Receipt #${ocr.receiptNumber}`
          : 'Scanned via Gemini Vision OCR'
      );

      setStep('review');
    } catch (err: any) {
      console.error('OCR scan failed:', err);
      // Fallback with defaults for user manual review
      setMerchant('Grocery / Store');
      setAmount(500);
      setCategory('Groceries');
      setExpenseDate(new Date().toISOString().slice(0, 10));
      setConfidenceScore(45);
      setConfidenceNotes('Could not automatically parse receipt. Please verify fields.');
      setStep('review');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: 'Item Name', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }

    const paidByMember = familyMembers.find((m) => m.userId === paidByUserId);
    const paidByName = paidByMember ? paidByMember.fullName : (currentUser?.fullName || 'Family Member');

    await addExpense({
      amount: Number(amount),
      currency: '₹',
      category,
      merchant: merchant.trim() || 'Unspecified Merchant',
      expenseDate: expenseDate || new Date().toISOString().slice(0, 10),
      createdBy: paidByUserId || currentUser?.id || 'usr_default',
      createdByName: paidByName,
      notes: notes.trim(),
      receiptImage: selectedImage || undefined,
      items: items.length > 0 ? items : undefined,
    });

    onClose();
    resetModal();
  };

  const resetModal = () => {
    setStep('upload');
    setSelectedImage(null);
    setErrorMsg(null);
    setMerchant('');
    setAmount('');
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Scan Receipt with AI OCR
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-extract total, merchant, date & line items
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetModal();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD / CAMERA */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-3xl p-8 text-center cursor-pointer transition-all hover:scale-[0.99] group"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Upload or Snap Receipt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                  Tap to capture with camera or choose image from gallery (JPG, PNG)
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all">
                  <Upload className="w-4 h-4" />
                  Select Image
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Sample test receipts for instant testing */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Or try sample receipts for instant testing:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const sample1 = 'https://picsum.photos/seed/sample_receipt_groceries/600/900';
                      setSelectedImage(sample1);
                      processOCR(sample1);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 text-left transition-all flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Supermarket Bill</p>
                      <p className="text-[10px] text-slate-400">Grocery items sample</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const sample2 = 'https://picsum.photos/seed/sample_receipt_restaurant/600/900';
                      setSelectedImage(sample2);
                      processOCR(sample2);
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 text-left transition-all flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Diner Bill</p>
                      <p className="text-[10px] text-slate-400">Food & Dining sample</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: OCR SCANNING ANIMATION */}
          {step === 'scanning' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-48 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Receipt target"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                {/* Scanner laser bar animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 shadow-[0_0_15px_#10B981] animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  Gemini AI Analyzing Receipt...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Extracting store name, total price, dates and line items...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: EDITABLE REVIEW */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Confidence badge banner */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-medium ${
                  confidenceScore >= 80
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : confidenceScore >= 50
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {confidenceScore >= 80 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {confidenceScore >= 80 ? 'High Confidence OCR' : 'Needs Review'}
                    </span>
                    <p className="text-[11px] opacity-90">
                      {confidenceNotes || 'Review extracted details below before saving.'}
                    </p>
                  </div>
                </div>

                {selectedImage && (
                  <button
                    onClick={() => setShowEnlargedImage(true)}
                    className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Photo
                  </button>
                )}
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Total Amount */}
                <div className="sm:col-span-2 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                  <label className="block text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-400 mb-1">
                    Total Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 text-xl font-extrabold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Merchant Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Store / Merchant *
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Reliance Fresh"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.values(CATEGORIES).map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Paid By Member */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paid By *
                  </label>
                  <select
                    value={paidByUserId}
                    onChange={(e) => setPaidByUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Detected Line Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].name = e.target.value;
                            setItems(newItems);
                          }}
                          placeholder="Item name"
                          className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-white font-medium"
                        />
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].price = Number(e.target.value);
                            setItems(newItems);
                          }}
                          placeholder="Price"
                          className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No individual items extracted. You can add items manually above.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Tags
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details or tags"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          {step === 'review' ? (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Family Expense
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onClose();
                resetModal();
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Enlarged Receipt Photo Lightbox */}
      {showEnlargedImage && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowEnlargedImage(false)}
        >
          <div className="relative max-w-lg max-h-[85vh]">
            <img
              src={selectedImage}
              alt="Enlarged Receipt"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setShowEnlargedImage(false)}
              className="absolute -top-3 -right-3 p-2 bg-white text-slate-900 rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
