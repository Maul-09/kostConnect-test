'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Receipt, 
  CreditCard, 
  FileText, 
  Clock, 
  X, 
  ExternalLink, 
  Printer, 
  Sparkles,
  Building2,
  User,
  ShieldCheck,
  Bell
} from 'lucide-react';

export type NotificationCategory = 'payment' | 'contract' | 'invoice' | 'system';

export interface NotificationMeta {
  invoiceNumber?: string;
  amount?: number;
  tenantName?: string;
  roomNumber?: string;
  propertyName?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  desc: string;
  time: string;
  createdAt: number;
  isRead: boolean;
  meta?: NotificationMeta;
}

export interface PaymentSuccessData {
  invoiceNumber: string;
  amount: number;
  tenantName?: string;
  roomNumber?: string;
  propertyName?: string;
  paymentMethod?: string;
  orderId?: string;
  date?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: {
    category: NotificationCategory;
    title: string;
    desc: string;
    meta?: NotificationMeta;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Notification detail modal
  selectedNotification: NotificationItem | null;
  openNotificationDetail: (item: NotificationItem) => void;
  closeNotificationDetail: () => void;

  // Payment success popup modal
  paymentSuccessData: PaymentSuccessData | null;
  showPaymentSuccessModal: boolean;
  triggerPaymentSuccess: (data: PaymentSuccessData) => void;
  closePaymentSuccessModal: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'invoice',
    title: 'Tagihan sewa mendekati jatuh tempo',
    desc: 'Invoice tagihan INV-202610-002 untuk Budi Santoso (Kamar 101) belum dibayar. Batas waktu pelunasan tersisa 3 hari.',
    time: 'Hari ini, 12.00 WIB',
    createdAt: Date.now() - 3600000,
    isRead: false,
    meta: {
      invoiceNumber: 'INV-202610-002',
      amount: 1800000,
      tenantName: 'Budi Santoso',
      roomNumber: '101',
      propertyName: 'Kos Harmoni Residence',
      actionUrl: '/invoices',
      actionLabel: 'Buka Halaman Tagihan',
    },
  },
  {
    id: 'notif-2',
    category: 'payment',
    title: 'Pembayaran Midtrans berhasil diverifikasi',
    desc: 'Invoice INV-202609-001 senilai Rp 1.800.000 telah lunas via Midtrans Snap. Dana transaksi telah diselesaikan (settlement).',
    time: 'Kemarin, 14.30 WIB',
    createdAt: Date.now() - 86400000,
    isRead: false,
    meta: {
      invoiceNumber: 'INV-202609-001',
      amount: 1800000,
      tenantName: 'Budi Santoso',
      roomNumber: '101',
      propertyName: 'Kos Harmoni Residence',
      actionUrl: '/invoices',
      actionLabel: 'Lihat Bukti Tagihan',
    },
  },
  {
    id: 'notif-3',
    category: 'contract',
    title: 'Kontrak sewa baru aktif',
    desc: 'Kontrak sewa penghuni Siti Rahma di Kamar A1 telah resmi terbit. Status inventaris kamar otomatis menjadi OCCUPIED.',
    time: '24 Sep 2026, 09.15 WIB',
    createdAt: Date.now() - 172800000,
    isRead: true,
    meta: {
      tenantName: 'Siti Rahma',
      roomNumber: 'A1',
      propertyName: 'Kos Putri Griya Asri',
      actionUrl: '/tenants',
      actionLabel: 'Kelola Kontrak Sewa',
    },
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccessData | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kosconnect_notifications_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage on change
  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem('kosconnect_notifications_v1', JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const addNotification = useCallback((item: {
    category: NotificationCategory;
    title: string;
    desc: string;
    meta?: NotificationMeta;
  }) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category: item.category,
      title: item.title,
      desc: item.desc,
      time: 'Baru saja',
      createdAt: Date.now(),
      isRead: false,
      meta: item.meta,
    };

    setNotifications((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('kosconnect_notifications_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem('kosconnect_notifications_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      try {
        localStorage.setItem('kosconnect_notifications_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      try {
        localStorage.setItem('kosconnect_notifications_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    saveNotifications([]);
  }, []);

  const openNotificationDetail = useCallback((item: NotificationItem) => {
    // Otomatis tandai sebagai sudah dibaca ketika modal detail dibuka
    markAsRead(item.id);
    setSelectedNotification({ ...item, isRead: true });
  }, [markAsRead]);

  const closeNotificationDetail = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  // Trigger celebration payment success modal
  const triggerPaymentSuccess = useCallback((data: PaymentSuccessData) => {
    const formattedDate = data.date || new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const enriched: PaymentSuccessData = {
      ...data,
      date: formattedDate,
      paymentMethod: data.paymentMethod || 'Midtrans Snap (Settlement)',
    };

    setPaymentSuccessData(enriched);
    setShowPaymentSuccessModal(true);

    // Otomatis tambahkan ke notification feed
    addNotification({
      category: 'payment',
      title: `Pembayaran ${enriched.invoiceNumber} Berhasil Lunas!`,
      desc: `Pembayaran sewa senilai Rp ${Number(enriched.amount).toLocaleString('id-ID')} telah sukses diverifikasi oleh Midtrans Snap.`,
      meta: {
        invoiceNumber: enriched.invoiceNumber,
        amount: enriched.amount,
        tenantName: enriched.tenantName,
        roomNumber: enriched.roomNumber,
        propertyName: enriched.propertyName,
        actionUrl: '/invoices',
        actionLabel: 'Buka Halaman Tagihan',
      },
    });
  }, [addNotification]);

  const closePaymentSuccessModal = useCallback(() => {
    setShowPaymentSuccessModal(false);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        selectedNotification,
        openNotificationDetail,
        closeNotificationDetail,
        paymentSuccessData,
        showPaymentSuccessModal,
        triggerPaymentSuccess,
        closePaymentSuccessModal,
      }}
    >
      {children}

      {/* ========================================================================= */}
      {/* 1. POPUP DETAIL NOTIFIKASI INTERAKTIF (BUKAN CUMAN PENANDA DIBACA)       */}
      {/* ========================================================================= */}
      {selectedNotification && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) closeNotificationDetail();
          }}
          className="fixed inset-0 z-[99998] bg-slate-950/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header with Category Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1.5 ${
                  selectedNotification.category === 'payment'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : selectedNotification.category === 'invoice'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : selectedNotification.category === 'contract'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedNotification.category === 'payment'
                      ? 'bg-emerald-500'
                      : selectedNotification.category === 'invoice'
                      ? 'bg-amber-500'
                      : selectedNotification.category === 'contract'
                      ? 'bg-blue-500'
                      : 'bg-indigo-500'
                  }`} />
                  {selectedNotification.category === 'payment' && 'PEMBAYARAN MIDTRANS'}
                  {selectedNotification.category === 'invoice' && 'TAGIHAN SEWA'}
                  {selectedNotification.category === 'contract' && 'KONTRAK PENGHUNI'}
                  {selectedNotification.category === 'system' && 'NOTIFIKASI SISTEM'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {selectedNotification.time}
                </span>
              </div>

              <button
                onClick={closeNotificationDetail}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title="Tutup Rincian"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Icon Header */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                selectedNotification.category === 'payment'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : selectedNotification.category === 'invoice'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : selectedNotification.category === 'contract'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
              }`}>
                {selectedNotification.category === 'payment' && <CreditCard className="w-6 h-6" />}
                {selectedNotification.category === 'invoice' && <Receipt className="w-6 h-6" />}
                {selectedNotification.category === 'contract' && <FileText className="w-6 h-6" />}
                {selectedNotification.category === 'system' && <Bell className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {selectedNotification.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedNotification.desc}
                </p>
              </div>
            </div>

            {/* Rich Metadata Card (Jika ada) */}
            {selectedNotification.meta && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rincian Data Terkait
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {selectedNotification.meta.invoiceNumber && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">No. Invoice</span>
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        {selectedNotification.meta.invoiceNumber}
                      </span>
                    </div>
                  )}
                  {selectedNotification.meta.amount && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">Nominal</span>
                      <span className="font-black text-indigo-700 text-[11px]">
                        Rp {Number(selectedNotification.meta.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {selectedNotification.meta.tenantName && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">Penghuni / Penyewa</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {selectedNotification.meta.tenantName}
                      </span>
                    </div>
                  )}
                  {selectedNotification.meta.roomNumber && (
                    <div>
                      <span className="text-[10px] text-slate-500 block">Unit Kamar</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        Kamar {selectedNotification.meta.roomNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {selectedNotification.meta?.actionUrl && (
                <button
                  onClick={() => {
                    const target = selectedNotification.meta?.actionUrl;
                    closeNotificationDetail();
                    if (target) router.push(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {selectedNotification.meta.actionLabel || 'Buka Halaman'}
                </button>
              )}
              <button
                onClick={closeNotificationDetail}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED POPUP SUKSES PEMBAYARAN (CELEBRATION PAYMENT MODAL)           */}
      {/* ========================================================================= */}
      {showPaymentSuccessModal && paymentSuccessData && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) closePaymentSuccessModal();
          }}
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[36px] max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />

            {/* Big Animated Success Checkmark Ring */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center mt-2">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25" />
              <div className="w-18 h-18 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Heading */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">
                • TRANSAKSI BERHASIL VERIFIKASI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pembayaran Sukses!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Terima kasih! Gateway Midtrans Snap telah mengonfirmasi pelunasan tagihan sewa Anda.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[11px] font-bold text-slate-500">Total Nominal</span>
                <span className="text-base font-black text-slate-900">
                  Rp {Number(paymentSuccessData.amount).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">No. Invoice</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">
                  {paymentSuccessData.invoiceNumber}
                </span>
              </div>

              {paymentSuccessData.tenantName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Nama Penghuni</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {paymentSuccessData.tenantName}
                  </span>
                </div>
              )}

              {paymentSuccessData.roomNumber && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Unit Kamar</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    Kamar {paymentSuccessData.roomNumber} • {paymentSuccessData.propertyName || 'Kos Harmoni'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Metode Pembayaran</span>
                <span className="font-bold text-emerald-700 text-[11px] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {paymentSuccessData.paymentMethod || 'Midtrans Snap'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 text-[11px]">Waktu Transaksi</span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {paymentSuccessData.date}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Cetak Bukti
              </button>

              <button
                onClick={closePaymentSuccessModal}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
