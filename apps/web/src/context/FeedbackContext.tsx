'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  X, 
  Loader2 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface FeedbackContextType {
  // Toast notifications (CRUD info popup)
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  // Popup loading overlay
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFirstMount = useRef(true);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Memuat data...');

  // Fallback trigger for non-click transitions (e.g. browser back/forward)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setIsLoading((currentlyLoading) => {
        if (!currentlyLoading) {
          setLoadingMessage('Sinkronisasi halaman & data...');
          const navTimer = setTimeout(() => {
            setIsLoading(false);
          }, 450);
          return true;
        }
        return currentlyLoading;
      });
    }
  }, [pathname]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showLoading = useCallback((message = 'Memuat data...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Safety auto-dismiss after 8 seconds
    timerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 8000);
  }, []);

  const hideLoading = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(false);
  }, []);

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        showLoading,
        hideLoading,
        isLoading,
        loadingMessage,
      }}
    >
      {children}

      {/* ===================== POPUP LOADING OVERLAY (FULL VIEWPORT) ===================== */}
      {isLoading && (
        <div className="fixed inset-0 z-[99999] w-screen h-screen bg-slate-950/55 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Animated High-Fidelity Dual-Ring Spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <div className="w-10 h-10 rounded-2xl bg-indigo-50/80 flex items-center justify-center shadow-inner">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                {loadingMessage}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Sedang memproses permintaan data ke server...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== POPUP TOAST NOTIFICATIONS (CRUD) ===================== */}
      <div className="fixed top-5 right-5 z-[130] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-xl transition-all animate-in slide-in-from-top-4 fade-in duration-300 flex items-start gap-3.5 ${
                isSuccess
                  ? 'bg-white/95 border-emerald-200 text-slate-900 shadow-emerald-500/10'
                  : isError
                  ? 'bg-white/95 border-rose-200 text-slate-900 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-white/95 border-amber-200 text-slate-900 shadow-amber-500/10'
                  : 'bg-white/95 border-indigo-200 text-slate-900 shadow-indigo-500/10'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                    : isError
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                    : isWarning
                    ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200/60'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <XCircle className="w-5 h-5" />}
                {isWarning && <AlertCircle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-extrabold text-xs text-slate-900 leading-snug">
                    {toast.title}
                  </h5>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words">
                    {toast.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
