'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Receipt, 
  LayoutDashboard, 
  Bell, 
  KeyRound, 
  LogOut, 
  Home, 
  X, 
  Check, 
  Trash2, 
  Clock, 
  User, 
  UserCheck 
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

const navigation = [
  { name: 'Beranda Overview', href: '/', icon: LayoutDashboard },
  { name: 'Properti & Kamar (Aset)', href: '/properties', icon: Building2 },
  { name: 'Penyewa & Kontrak (CRM)', href: '/tenants', icon: Users },
  { name: 'Tagihan & Payment (Keuangan)', href: '/invoices', icon: Receipt },
  { name: 'Portal Penyewa (Client)', href: '/portal', icon: UserCheck },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTenantPortal = pathname.startsWith('/portal');

  // Helper page title for clean navbar
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname.startsWith('/properties')) return 'Properti & Unit Kamar (Aset)';
    if (pathname.startsWith('/tenants')) return 'Penyewa & Kontrak Sewa (CRM)';
    if (pathname.startsWith('/invoices')) return 'Tagihan & Pembayaran (Keuangan)';
    if (pathname.startsWith('/portal')) return 'Portal Mandiri Penyewa';
    return 'KosConnect ERP';
  };

  // Notification Popup State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Tagihan sewa mendekati jatuh tempo',
      desc: 'Invoice INV-202610-002 untuk Budi Santoso (Kamar 101) belum dibayar. Perlu tindak lanjut.',
      time: 'Hari ini, 12.00 WIB',
      isRead: false,
    },
    {
      id: '2',
      title: 'Pembayaran Midtrans berhasil diverifikasi',
      desc: 'Invoice INV-202609-001 senilai Rp 1.800.000 telah lunas via Midtrans Snap.',
      time: 'Kemarin, 14.30 WIB',
      isRead: false,
    },
    {
      id: '3',
      title: 'Kontrak sewa baru aktif',
      desc: 'Kontrak sewa Siti Rahma di Kamar A1 telah terbit. Kamar otomatis menjadi OCCUPIED.',
      time: '24 Sep 2026, 09.15 WIB',
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifTab === 'unread' 
    ? notifications.filter((n) => !n.isRead) 
    : notifications;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#f1f3f9] via-[#f8fafc] to-[#eef2ff] text-slate-800 p-3 md:p-4 gap-4 font-sans select-none relative">
      {/* Ambient Gradient Glows (Sapphire & Indigo Atmospheric Glow) */}
      <div className="fixed -top-24 -right-24 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-64 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 100% FIXED & STICKY SIDEBAR (Deep Midnight Obsidian #0b0f19) */}
      <aside className="w-64 h-full shrink-0 bg-[#0b0f19] text-slate-200 rounded-[26px] p-5 flex flex-col justify-between shadow-2xl border border-slate-800/80 hidden lg:flex select-none z-30">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-indigo-950/70 shrink-0">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                KosConnect
              </span>
              <span className="text-[9px] tracking-[0.22em] font-extrabold text-indigo-400 uppercase block mt-1.5">
                PROPERTY ERP
              </span>
            </div>
          </div>

          {/* Section: RUANG KERJA */}
          <div className="mt-8 mb-2.5 px-3">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 block">
              NAVIGASI UTAMA
            </span>
          </div>

          {/* Clean Core Navigation Links (No Swagger / No Clutter) */}
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-950/90 to-slate-900 text-white shadow-inner border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card (Adapts to Active Role Persona) */}
        <div className="bg-[#070b13] rounded-2xl p-3 border border-slate-800/80 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${
              isTenantPortal 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/40' 
                : 'bg-gradient-to-br from-indigo-600 to-slate-800 border border-indigo-400/30'
            }`}>
              {isTenantPortal ? 'BS' : 'MA'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {isTenantPortal ? 'Budi Santoso' : 'Admin Muhammad Ajiz'}
              </p>
              <p className="text-[10px] text-indigo-400 font-medium">
                {isTenantPortal ? 'Penyewa Kamar 101' : 'Owner / Property Admin'}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span className="hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors">
              <KeyRound className="w-3 h-3" /> Password
            </span>
            <span className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors">
              <LogOut className="w-3 h-3" /> Keluar
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA (Clean, Professional, Synchronized) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Sleek Professional Topbar (Ringkas & Tidak Ramai) */}
        <header className="bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shrink-0 z-20 gap-4">
          {/* Left: Active Section Title */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight truncate">
              {getPageTitle()}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>

          {/* Right: Role Switcher & Notification & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Minimalist Role Switcher */}
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 text-xs">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  !isTenantPortal
                    ? 'bg-[#0b0f19] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Beralih ke Mode Pengelola Kos (Akses ERP Penuh)"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pengelola</span>
              </Link>
              <Link
                href="/portal"
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  isTenantPortal
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Beralih ke Portal Penyewa (Bayar Tagihan)"
              >
                <User className="w-3.5 h-3.5 text-indigo-200" />
                <span>Penyewa</span>
              </Link>
            </div>

            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none"
              title="Buka Notifikasi"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200/80">
              <div className={`w-7 h-7 rounded-full text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs ${
                isTenantPortal ? 'bg-blue-600' : 'bg-[#0b0f19] text-indigo-300'
              }`}>
                {isTenantPortal ? 'BS' : 'MA'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {isTenantPortal ? 'Budi Santoso' : 'Admin Ajiz'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {isTenantPortal ? 'Penyewa' : 'Pengelola'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body (Only this area scrolls) */}
        <main className="flex-1 overflow-y-auto pr-1 pb-6 space-y-6">
          {children}
        </main>
      </div>

      {/* POPUP NOTIFIKASI MODAL (Selaras, Lapang, Tanpa Tombol Arsipkan) */}
      {showNotificationModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNotificationModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] max-w-2xl md:max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 block mb-1.5">
                  • ADMIN • NOTIFIKASI
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Notifikasi Operasional
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                  Pembaruan jadwal sewa kos, konfirmasi transaksi pembayaran Midtrans, dan pengingat jatuh tempo.
                </p>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 w-fit">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    notifTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('unread')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    notifTab === 'unread'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Belum dibaca ({unreadCount})
                </button>
              </div>

              <div>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 disabled:opacity-40 disabled:pointer-events-none text-indigo-700 text-xs font-bold shadow-2xs transition-all"
                >
                  <Check className="w-4 h-4 text-indigo-600" /> Tandai semua dibaca
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {notifTab === 'unread' ? 'Semua notifikasi telah dibaca' : 'Tidak ada notifikasi'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {notifTab === 'unread' 
                      ? 'Seluruh pesan dan jadwal tagihan sudah Anda konfirmasi.' 
                      : 'Belum ada aktivitas operasional baru saat ini.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                      );
                    }}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all flex items-start justify-between gap-4 cursor-pointer hover:shadow-xs ${
                      !notif.isRead
                        ? 'bg-indigo-50/60 border-indigo-200 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        !notif.isRead ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Belum dibaca" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {notif.desc}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {notif.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
