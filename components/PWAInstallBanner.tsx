'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share2, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    }

    // Check if running as standalone PWA
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
      }

      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      alert(
        'To install PaisaKG App on your device:\n1. Open your browser menu (3 dots or share icon)\n2. Tap "Add to Home Screen" or "Install App"'
      );
    }
  };

  if (isInstalled || !showBanner) return null;

  return (
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
          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#f2f5e8] text-[#0a452b] hover:bg-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
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

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f2f5e8] text-[#0d1f15] p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-xl border border-[#d5dbcb]">
            <h3 className="font-bold text-base flex items-center gap-2 text-[#0a452b]">
              <Smartphone className="w-5 h-5" /> Install on iOS / Safari
            </h3>
            <ol className="text-xs space-y-2 list-decimal list-inside text-slate-700">
              <li>
                Tap the <Share2 className="w-4 h-4 inline text-[#0a452b]" />{' '}
                <strong>Share</strong> button in Safari
              </li>
              <li>
                Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>
              </li>
              <li>
                Tap <strong>Add</strong> in the top right corner
              </li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-xl bg-[#0a452b] text-white text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
