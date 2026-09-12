"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { APP_NAME } from "@/lib/config";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash before checking
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA window or home screen
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true;
    
    // Check localStorage for previous installation or dismissal record
    const hasInstalled = localStorage.getItem("rpavault_pwa_installed") === "true";
    const hasDismissed = localStorage.getItem("rpavault_pwa_dismissed") === "true";

    if (isStandaloneMode || hasInstalled || hasDismissed) {
      setIsStandalone(true);
      return;
    } else {
      setIsStandalone(false);
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Listen for Chrome/Edge/Android PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem("rpavault_pwa_installed", "true");
      setIsStandalone(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null; // Already installed or dismissed
  }

  async function handleInstallClick() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem("rpavault_pwa_installed", "true");
        setIsStandalone(true);
        setInstallPrompt(null);
      }
    } else {
      setShowIOSModal(true);
    }
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    localStorage.setItem("rpavault_pwa_installed", "true");
    localStorage.setItem("rpavault_pwa_dismissed", "true");
    setDismissed(true);
  }


  return (
    <>
      <div className="relative group mb-2">
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/40 transition"
          title={`Install ${APP_NAME} as a desktop or mobile application`}
        >
          <div className="flex items-center gap-2 truncate">
            <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
            <span className="truncate">Install App</span>
          </div>
          <span
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
            title="Hide install button"
          >
            <X className="w-3 h-3" />
          </span>
        </button>
      </div>

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
              Install {APP_NAME}
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
                  <p>• <strong>Mac / Windows (Chrome/Edge)</strong>: Look for the <strong>Install icon</strong> in your browser address bar on the right.</p>
                  <p>• <strong>Android</strong>: Tap browser menu (⋮) and select <strong>Add to Home screen</strong>.</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  localStorage.setItem("rpavault_pwa_installed", "true");
                  setShowIOSModal(false);
                  setIsStandalone(true);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 underline"
              >
                Already installed? Don't show again
              </button>
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
