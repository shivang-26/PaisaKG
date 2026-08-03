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
  ArrowLeft,
  Receipt,
  Eye,
  Key,
} from 'lucide-react';

interface ScanReceiptModalProps {
  isOpen: boolean;
  initialMode?: 'camera' | 'gallery';
  onClose: () => void;
}

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  isOpen,
  initialMode = 'camera',
  onClose,
}) => {
  const { currentUser, familyMembers, addExpense, getActiveGeminiApiKeyInfo, setActiveTab } = useApp();

  const [step, setStep] = useState<'camera' | 'gallery' | 'scanning' | 'review'>(initialMode);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Camera state & refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef<boolean>(false);

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

  const stopCamera = React.useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(false);
    } catch (err) {
      console.warn('Camera access error or unsupported:', err);
      setCameraError(true);
    }
  }, [stopCamera]);

  const processOCR = React.useCallback(
    async (imageBase64: string) => {
      setStep('scanning');
      setIsScanning(true);
      setErrorMsg(null);

      try {
        const activeKeyInfo = getActiveGeminiApiKeyInfo();
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            apiKey: activeKeyInfo.key,
          }),
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
    },
    [getActiveGeminiApiKeyInfo]
  );

  // Handle modal open/close state transitions cleanly
  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(() => {
        setStep(initialMode);
        if (initialMode === 'gallery') {
          stopCamera();
          fileInputRef.current?.click();
        } else {
          startCamera();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isOpen && prevIsOpenRef.current) {
      stopCamera();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setSelectedImage(dataUrl);
      processOCR(dataUrl);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 1000);
      stopCamera();
      setSelectedImage(base64);
      processOCR(base64);
    } catch (err) {
      setErrorMsg('Failed to process image file');
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
    setStep('scanning');
    setSelectedImage(null);
    setErrorMsg(null);
    setMerchant('');
    setAmount('');
    setItems([]);
  };  if (step === 'camera') {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200 h-screen w-screen">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Floating Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 pt-5 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
              resetModal();
            }}
            className="p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all border border-white/10 shadow-lg"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-white text-xs font-bold shadow-lg">
            <ScanLine className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Scan Receipt / Bill</span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setStep('gallery');
              fileInputRef.current?.click();
            }}
            className="px-3.5 py-2 rounded-full bg-black/60 hover:bg-black/90 text-white text-xs font-bold border border-white/10 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gallery</span>
          </button>
        </div>

        {/* Center Camera Viewfinder Container */}
        <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden bg-black">
          {!cameraError ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Paytm-style Scanner Square Frame Overlay */}
              <div className="relative w-[86vw] max-w-xs sm:max-w-sm h-[56vh] max-h-[460px] rounded-3xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col justify-between p-4 pointer-events-none z-10">
                {/* 4 Corner L-brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl shadow-[0_0_10px_#10b981]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl shadow-[0_0_10px_#10b981]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl shadow-[0_0_10px_#10b981]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl shadow-[0_0_10px_#10b981]" />

                {/* Laser animation */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce my-auto" />

                <div className="mt-auto text-center">
                  <span className="inline-block bg-black/70 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                    Align bill or receipt inside frame
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-white space-y-4 max-w-xs z-10">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Camera Access Restricted</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Live camera stream is restricted or not permitted on this browser. You can select a photo file directly from your gallery.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-2xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                Select Receipt Image File
              </button>
            </div>
          )}
        </div>

        {/* Bottom Shutter Toolbar */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-6 pb-10 flex items-center justify-around bg-gradient-to-t from-black/95 via-black/60 to-transparent">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setStep('gallery');
              fileInputRef.current?.click();
            }}
            className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all"
            title="Upload from Gallery"
          >
            <Upload className="w-5 h-5 text-emerald-400" />
          </button>

          {/* Paytm-style large green shutter button */}
          <button
            type="button"
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white/90 bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-2xl active:scale-90 transition-transform p-1 cursor-pointer"
            title="Snap Photo"
          >
            <div className="w-full h-full rounded-full bg-[#0a452b] hover:bg-[#07331f] flex items-center justify-center text-white shadow-inner">
              <Camera className="w-8 h-8" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => startCamera()}
            className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all"
            title="Refresh Camera"
          >
            <RefreshCw className="w-5 h-5 text-emerald-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
              resetModal();
            }}
            className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
              <ScanLine className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                Scan Receipt with AI OCR
              </h2>
              <p className="text-[11px] text-slate-500">
                Instant bill & line-item extraction
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
            resetModal();
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Full-Page Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
          {/* Active Gemini Key Status Banner */}
          {(() => {
            const activeKeyInfo = getActiveGeminiApiKeyInfo();
            if (activeKeyInfo.source === 'none') {
              return (
                <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-semibold text-amber-900">
                      No Gemini API key set. Please configure your Personal or Family key.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveTab('family');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-800 text-white font-bold text-[11px] hover:bg-amber-900 shrink-0 self-end sm:self-auto"
                  >
                    Set Key in Settings
                  </button>
                </div>
              );
            }
            return (
              <div className="mb-4 p-2.5 px-3.5 rounded-2xl bg-white border border-[#d5dbcb] flex items-center justify-between gap-2 text-xs shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <Key className="w-3.5 h-3.5 text-[#0a452b] shrink-0" />
                  <span className="font-semibold text-[#0d1f15] truncate">
                    {activeKeyInfo.source === 'personal' && 'Using your Personal Gemini Key'}
                    {activeKeyInfo.source === 'family' && 'Using Family Shared Gemini Key'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('family');
                  }}
                  className="text-[11px] font-bold text-[#0a452b] hover:underline shrink-0"
                >
                  Configure Keys
                </button>
              </div>
            );
          })()}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 2: GALLERY UPLOAD */}
          {step === 'gallery' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#0a452b]/40 bg-[#e5e9d3] rounded-3xl p-6 sm:p-8 text-center transition-all">
                <div className="w-16 h-16 rounded-2xl bg-[#0a452b] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[#0d1f15] mb-1">
                  Upload Receipt Image
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mb-5">
                  Select a picture of your bill or receipt from your device gallery or files.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Browse Device Files
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('camera');
                      startCamera();
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#0d1f15] text-xs font-bold border border-[#d5dbcb] shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-[#0a452b]" />
                    Switch to Live Camera
                  </button>
                </div>

                {/* Hidden input for File selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 3: OCR SCANNING ANIMATION */}
          {step === 'scanning' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-48 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-[#0a452b] shadow-xl">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Receipt target"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                {/* Scanner laser bar animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 shadow-[0_0_15px_#0a452b] animate-bounce" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0d1f15] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0a452b]" />
                  Gemini AI Analyzing Receipt...
                </h3>
                <p className="text-xs text-slate-600 mt-1">
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
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : confidenceScore >= 50
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
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
                    className="p-1.5 rounded-lg bg-white hover:bg-[#e5e9d3] text-[#0d1f15] text-xs font-bold flex items-center gap-1 shadow-xs shrink-0 border border-[#d5dbcb]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0a452b]" />
                    View Photo
                  </button>
                )}
              </div>

              {/* Scanned Receipt Photo Card */}
              {selectedImage && (
                <div className="p-3 bg-white border border-[#d5dbcb] rounded-2xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0d1f15] flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#0a452b]" />
                      Uploaded Bill / Receipt Photo
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEnlargedImage(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#f2f5e8] hover:bg-[#e5e9d3] text-[#0a452b] text-[11px] font-bold flex items-center gap-1 border border-[#d5dbcb] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Full Photo
                    </button>
                  </div>

                  <div
                    onClick={() => setShowEnlargedImage(true)}
                    className="relative group cursor-pointer rounded-xl overflow-hidden border border-[#d5dbcb] bg-black max-h-52 flex items-center justify-center shadow-inner"
                  >
                    <img
                      src={selectedImage}
                      alt="Scanned Receipt"
                      className="max-h-52 w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2 backdrop-blur-xs">
                      <Eye className="w-5 h-5 text-emerald-400" />
                      <span>Tap to inspect photo</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Total Amount */}
                <div className="sm:col-span-2 bg-[#e5e9d3] p-3 rounded-2xl border border-[#d5dbcb]">
                  <label className="block text-[11px] font-bold uppercase text-[#0a452b] mb-1">
                    Total Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-lg font-extrabold text-[#0a452b]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 text-xl font-extrabold bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                    />
                  </div>
                </div>

                {/* Merchant Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store / Merchant *
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Reliance Fresh"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                  />
                </div>

                {/* Paid By Member */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paid By *
                  </label>
                  <select
                    value={paidByUserId}
                    onChange={(e) => setPaidByUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
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
                  <label className="text-xs font-bold text-slate-700">
                    Detected Line Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] font-bold text-[#0a452b] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#d5dbcb] text-xs"
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
                          className="flex-1 bg-transparent border-none focus:outline-none text-[#0d1f15] font-medium"
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
                          className="w-20 px-2 py-1 bg-[#f2f5e8] border border-[#d5dbcb] rounded-lg text-right font-bold text-[#0d1f15]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-dashed border-[#d5dbcb]">
                    No individual items extracted. You can add items manually above.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Tags
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details or tags"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#d5dbcb] rounded-xl text-[#0d1f15] focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 border-t border-[#d5dbcb] bg-[#e5e9d3] flex items-center justify-between gap-3">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('camera');
                  startCamera();
                }}
                className="px-3.5 py-2.5 rounded-xl border border-[#d5dbcb] text-xs font-bold text-slate-700 hover:bg-[#f2f5e8] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 px-5 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
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
              className="w-full py-2.5 rounded-xl border border-[#d5dbcb] text-xs font-bold text-slate-700 hover:bg-[#f2f5e8] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

      {/* Enlarged Receipt Photo Lightbox */}
      {showEnlargedImage && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setShowEnlargedImage(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-3xl flex items-center justify-between text-white z-10 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm">Receipt / Bill Photo Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selectedImage}
                download="receipt-photo.jpg"
                className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Upload className="w-3.5 h-3.5 rotate-180" />
                Download
              </a>
              <button
                type="button"
                onClick={() => setShowEnlargedImage(false)}
                className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Enlarged Center Image */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 my-2 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Enlarged Receipt"
              className="max-w-full max-h-[82vh] rounded-2xl object-contain shadow-2xl border border-white/10 bg-slate-950"
            />
          </div>

          <p className="text-xs text-slate-400 z-10 pb-2">
            Click anywhere outside or press Close to return
          </p>
        </div>
      )}
    </div>
  );
};
