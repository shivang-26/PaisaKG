'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share2, Sparkles, ExternalLink, CheckCircle, ArrowLeft } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    }
    return false;
  });
  const [showBanner, setShowBanner] = useState(true);
  const [isIOS] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    }
    return false;
  });
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);

  useEffect(() => {
    // Register Service Worker safely (avoiding issues in sandboxed preview iframes)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration bypassed:', err);
        });
      } catch (err) {
        console.warn('SW error:', err);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. Direct native prompt if available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
      } catch (err) {
        console.error('Install prompt failed:', err);
      }
      setDeferredPrompt(null);
      return;
    }

    // 2. If running inside preview iframe, open in top window directly so browser can install PWA
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (inIframe) {
      window.open(window.location.href, '_blank');
      return;
    }

    // 3. If iOS, show custom iOS action sheet
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // 4. Fallback for desktop/android when prompt event hasn't fired yet
    setShowFallbackModal(true);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      <div className="bg-[#0a452b] text-white px-4 py-3 rounded-2xl shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#07331f]">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#e5e9d3] p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-[#d5dbcb]">
            <img src="/logo.svg" alt="PaisaKG Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
              Install PaisaKG App <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            </h4>
            <p className="text-xs text-emerald-100">
              Get 1-tap home screen access & fast receipt scanning!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#f2f5e8] text-[#0a452b] hover:bg-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" /> Install App
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="p-2 text-emerald-200 hover:text-white rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Install Instructions FULL PAGE */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIOSInstructions(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Install on iOS / Safari
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Step-by-step home screen shortcut
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            <ol className="text-xs space-y-3 list-decimal list-inside text-slate-700 bg-white p-5 rounded-2xl border border-[#d5dbcb] shadow-2xs">
              <li className="leading-relaxed">
                Tap the <Share2 className="w-4 h-4 inline text-[#0a452b] mx-1" />{' '}
                <strong>Share</strong> button in Safari toolbar
              </li>
              <li className="leading-relaxed">
                Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>
              </li>
              <li className="leading-relaxed">
                Tap <strong>Add</strong> in top right corner
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 rounded-xl bg-[#0a452b] text-white text-xs font-bold shadow-xs hover:bg-[#07331f] transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Direct Installation / Standalone FULL PAGE */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-50 bg-[#e5e9d3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="px-4 py-3 bg-[#f2f5e8] border-b border-[#d5dbcb] flex items-center justify-between shadow-xs sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0d1f15] hover:bg-[#d5dbcb]/40 transition-all flex items-center justify-center"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0a452b] text-white flex items-center justify-center shadow-xs">
                  <Download className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0d1f15] leading-tight">
                    Install PaisaKG App
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Standalone App Installation
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFallbackModal(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-[#d5dbcb]/40 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-xl mx-auto w-full space-y-4">
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-[#d5dbcb]">
              To install PaisaKG directly onto your desktop or home screen:
            </p>

            <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#d5dbcb] text-xs shadow-2xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#0a452b] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Chrome / Edge / Brave:</strong> Click the <strong>Install</strong> icon in the address bar (top right).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#0a452b] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Mobile Web:</strong> Tap your browser menu (⋮) and choose <strong>Add to Home Screen</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowFallbackModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open Direct App Tab
              </button>
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                className="px-5 py-3 rounded-xl border border-[#d5dbcb] text-xs font-bold text-slate-700 bg-white hover:bg-[#e5e9d3] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

