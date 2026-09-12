"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if already launched in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for Chrome/Edge/Android PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) {
    return null; // Already installed and running as standalone app
  }

  async function handleInstallClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions fallback
      setShowIOSModal(true);
    }
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/40 transition mb-2"
        title="Install RPAVault To-Do as a desktop or mobile application"
      >
        <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
        <span className="truncate">Install App</span>
      </button>

      {/* iOS / General Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e222b] border border-slate-200 dark:border-[#2e3442] rounded-2xl p-5 max-w-sm w-full shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Install RPAVault To-Do
            </h3>

            {isIOS ? (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>To install on your iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-1 bg-slate-50 dark:bg-[#14161b] p-3 rounded-xl border border-slate-200 dark:border-[#2b303c]">
                  <li>Tap the <strong>Share</strong> icon (square with arrow up) at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>To install on Mac, Windows or Android:</p>
                <div className="bg-slate-50 dark:bg-[#14161b] p-3 rounded-xl border border-slate-200 dark:border-[#2b303c] space-y-1">
                  <p>• <strong>Mac / Windows (Chrome/Edge)</strong>: Click the <strong>Install icon</strong> in your browser address bar on the right.</p>
                  <p>• <strong>Android</strong>: Tap browser menu (⋮) and select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowIOSModal(false)}
                className="px-3.5 py-1.5 bg-[#4772fa] hover:bg-[#3861ea] text-white rounded-xl text-xs font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
