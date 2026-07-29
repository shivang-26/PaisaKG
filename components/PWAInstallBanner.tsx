'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share2, Sparkles, ExternalLink, CheckCircle } from 'lucide-react';

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
          <div className="w-10 h-10 rounded-xl bg-[#f2f5e8] text-[#0a452b] flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            ₹
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

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f2f5e8] text-[#0d1f15] p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl border border-[#d5dbcb]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2 text-[#0a452b]">
                <Smartphone className="w-5 h-5" /> Install on iOS / Safari
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 rounded-full text-slate-500 hover:text-[#0d1f15]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="text-xs space-y-2.5 list-decimal list-inside text-slate-700 bg-white p-4 rounded-2xl border border-[#d5dbcb]">
              <li>
                Tap the <Share2 className="w-4 h-4 inline text-[#0a452b] mx-1" />{' '}
                <strong>Share</strong> button in Safari toolbar
              </li>
              <li>
                Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>
              </li>
              <li>
                Tap <strong>Add</strong> in top right corner
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-[#0a452b] text-white text-xs font-bold shadow-md hover:bg-[#07331f]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Direct Installation / Standalone Modal Fallback */}
      {showFallbackModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f2f5e8] text-[#0d1f15] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl border border-[#d5dbcb]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2 text-[#0a452b]">
                <Download className="w-5 h-5" /> Install PaisaKG App
              </h3>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="p-1 rounded-full text-slate-500 hover:text-[#0d1f15]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              To install PaisaKG directly onto your desktop or home screen:
            </p>

            <div className="space-y-2 bg-white p-4 rounded-2xl border border-[#d5dbcb] text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#0a452b] shrink-0 mt-0.5" />
                <span>
                  <strong>Chrome / Edge / Brave:</strong> Click the <strong>Install</strong> icon in the address bar (top right).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#0a452b] shrink-0 mt-0.5" />
                <span>
                  <strong>Mobile Web:</strong> Tap your browser menu (⋮) and choose <strong>Add to Home Screen</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                  setShowFallbackModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0a452b] hover:bg-[#07331f] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-4 h-4" /> Open Direct App Tab
              </button>
              <button
                onClick={() => setShowFallbackModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#d5dbcb] text-xs font-bold text-slate-700 bg-white hover:bg-[#e5e9d3]"
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

