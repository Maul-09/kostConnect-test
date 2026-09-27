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
  UserCheck,
  Crown,
  ChevronDown
} from 'lucide-react';
import { useRole, ROLE_PROFILES, UserRole } from '@/context/RoleContext';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, setRole, currentProfile } = useRole();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Navigasi Terstruktur & Berbeda Jelas per Role
  const navConfig = (() => {
    if (role === 'TENANT') {
      return {
        sectionTitle: 'PENYEWA KOS',
        items: [
          { name: 'Dashboard Saya', href: '/', icon: LayoutDashboard },
          { name: 'Tagihan Saya', href: '/invoices', icon: Receipt },
          { name: 'Kamar Saya', href: '/portal', icon: Home },
        ],
      };
    }
    if (role === 'ADMIN') {
      return {
        sectionTitle: 'SUPER ADMIN PLATFORM',
        items: [
          { name: 'Dashboard Platform', href: '/', icon: LayoutDashboard },
          { name: 'Pendaftaran Properti', href: '/properties', icon: Building2 },
          { name: 'Mitra & Penyewa', href: '/tenants', icon: Users },
          { name: 'Audit Pembayaran', href: '/invoices', icon: Receipt },
        ],
      };
    }
    // OWNER (Pemilik Kos Harmoni)
    return {
      sectionTitle: 'PEMILIK KOS HARMONI',
      items: [
        { name: 'Dashboard Kos', href: '/', icon: LayoutDashboard },
        { name: 'Kamar Kos Harmoni', href: '/properties', icon: Building2 },
        { name: 'Penyewa Kos Saya', href: '/tenants', icon: Users },
        { name: 'Tagihan Sewa', href: '/invoices', icon: Receipt },
      ],
    };
  })();

  // Judul Halaman yang Selaras dengan Perspektif Role
  const getPageTitle = () => {
    if (pathname === '/') {
      if (role === 'ADMIN') return 'Dashboard Platform';
      if (role === 'OWNER') return 'Dashboard Kos Harmoni';
      return 'Dashboard Penyewa';
    }
    if (pathname.startsWith('/properties')) {
      if (role === 'ADMIN') return 'Pendaftaran Properti Mitra';
      if (role === 'OWNER') return 'Kamar Kos Harmoni Residence';
      return 'Informasi Properti';
    }
    if (pathname.startsWith('/tenants')) {
      if (role === 'ADMIN') return 'Direktori Mitra & Penyewa';
      if (role === 'OWNER') return 'Penyewa Kos Harmoni';
      return 'Data Penyewa';
    }
    if (pathname.startsWith('/invoices')) {
      if (role === 'ADMIN') return 'Audit Transaksi Pembayaran';
      if (role === 'OWNER') return 'Tagihan Sewa Masuk';
      return 'Tagihan Sewa Saya';
    }
    if (pathname.startsWith('/portal')) return 'Kamar Kos Saya';
    return 'KosConnect';
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
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#f1f3f9] via-[#f8fafc] to-[#eef2ff] text-slate-800 p-2 sm:p-4 gap-2.5 sm:gap-4 font-sans select-none relative">
      {/* Ambient background accents */}
      <div className="fixed -top-24 -right-24 w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-64 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Desktop navigation sidebar */}
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
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 block truncate">
              {navConfig.sectionTitle}
            </span>
          </div>

          {/* Clean Navigation Links tailored to the Role */}
          <nav className="space-y-1.5">
            {navConfig.items.map((item) => {
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
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${currentProfile.avatarBg}`}>
              {currentProfile.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentProfile.name}
              </p>
              <p className="text-[10px] text-indigo-400 font-medium">
                {currentProfile.title}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <button 
              onClick={() => setShowRoleDropdown(true)}
              className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
              title="Ganti Role Perspektif"
            >
              <KeyRound className="w-3 h-3" /> Ganti Role
            </button>
            <span 
              onClick={() => {
                if (confirm('Reset ke role Pemilik Kos default?')) {
                  setRole('OWNER');
                }
              }}
              className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3 h-3" /> Reset
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA (Clean, Professional, Synchronized) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Sleek Professional Topbar (Responsive di Mobile & Desktop) */}
        <header className="bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 mb-2.5 sm:mb-4 flex items-center justify-between shrink-0 z-20 gap-3">
          {/* Left: Mobile Brand & Active Section Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 flex items-center justify-center text-white shrink-0 lg:hidden shadow-xs">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-800 tracking-tight truncate">
                {getPageTitle()}
              </h1>
              <span className="text-[10px] text-indigo-600 font-bold block sm:hidden truncate leading-none mt-0.5">
                {currentProfile.badge}
              </span>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>

          {/* Right: Notification & Interactive Role Switcher Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-600 transition-colors focus:outline-none cursor-pointer"
              title="Buka Notifikasi"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Interactive Role Switcher Trigger Button */}
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:px-3.5 sm:py-2 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl transition-all focus:outline-none group shadow-xs hover:shadow-sm cursor-pointer"
              title="Klik untuk memilih perspektif role (Super Admin, Pemilik Kos, Penyewa)"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-extrabold text-[11px] sm:text-xs shadow-xs ${currentProfile.avatarBg}`}>
                {currentProfile.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-tight">
                  {currentProfile.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    role === 'ADMIN' ? 'bg-purple-500' : role === 'OWNER' ? 'bg-indigo-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-[10px] font-bold text-slate-500 leading-none">
                    {currentProfile.badge}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ml-0.5 ${showRoleDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body (Dengan padding bawah ekstra di mobile agar tidak tertutup bottom bar) */}
        <main className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-6 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Dekat Tombol/Menu Home di Bawah HP)          */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-2xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.45)] lg:hidden select-none">
        {navConfig.items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          // Singkatkan label untuk layar HP kecil
          const shortLabel = (() => {
            if (item.name.includes('Dashboard')) return 'Home';
            if (item.name.includes('Properti') || item.name.includes('Kamar')) return 'Unit';
            if (item.name.includes('Mitra') || item.name.includes('Penyewa')) return 'Penyewa';
            if (item.name.includes('Tagihan') || item.name.includes('Audit')) return 'Tagihan';
            return item.name;
          })();

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl transition-all min-w-[56px] ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-950/60 scale-105' 
                  : 'text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] tracking-tight leading-none ${
                isActive ? 'font-black text-indigo-300' : 'font-semibold text-slate-400'
              }`}>
                {shortLabel}
              </span>
            </Link>
          );
        })}

        {/* Tombol Ganti Role Langsung di Bottom Bar HP */}
        <button
          onClick={() => setShowRoleDropdown(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-2xl transition-all min-w-[56px] text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-[10px] shadow-xs ${currentProfile.avatarBg}`}>
            {currentProfile.avatar}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 leading-none">
            Role
          </span>
        </button>
      </nav>

      {/* Notifications modal */}
      {showNotificationModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNotificationModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-[32px] sm:rounded-[32px] max-w-2xl md:max-w-3xl w-full p-5 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  • NOTIFIKASI OPERASIONAL
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Notifikasi Sistem
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
                  Pembaruan jadwal sewa kos, konfirmasi transaksi pembayaran Midtrans, dan pengingat jatuh tempo.
                </p>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Filter Tabs & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 w-fit">
                <button
                  onClick={() => setNotifTab('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notifTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifTab('unread')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 disabled:opacity-40 disabled:pointer-events-none text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /> Tandai semua dibaca
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="space-y-2.5 max-h-[50vh] sm:max-h-[380px] overflow-y-auto pr-1 sm:pr-2">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    {notifTab === 'unread' ? 'Semua notifikasi telah dibaca' : 'Tidak ada notifikasi'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
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
                    className={`rounded-2xl p-3.5 sm:p-5 border transition-all flex items-start justify-between gap-3 sm:gap-4 cursor-pointer hover:shadow-xs ${
                      !notif.isRead
                        ? 'bg-indigo-50/60 border-indigo-200 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        !notif.isRead ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
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
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {notif.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role switcher modal */}
      {showRoleDropdown && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoleDropdown(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md sm:max-w-sm sm:mt-16 sm:mr-3 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 bg-white/95 backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_rgba(8,15,30,0.3)] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-0.5">
                  PILIH ROLE
                </span>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  Ganti Akun Pengguna
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih role untuk mencoba hak akses fitur yang berbeda.
                </p>
              </div>
              <button
                onClick={() => setShowRoleDropdown(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Options List */}
            <div className="space-y-2">
              {(['ADMIN', 'OWNER', 'TENANT'] as UserRole[]).map((r) => {
                const profile = ROLE_PROFILES[r];
                const isSelected = role === r;

                return (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-2xl transition-all flex items-start gap-3 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-50/90 to-purple-50/60 border-indigo-400/80 shadow-xs ring-1 ring-indigo-400/30'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                      r === 'ADMIN' 
                        ? 'bg-gradient-to-br from-indigo-800 to-purple-900 text-white' 
                        : r === 'OWNER' 
                        ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-300' 
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                    }`}>
                      {r === 'ADMIN' ? (
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                      ) : r === 'OWNER' ? (
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                      ) : (
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {profile.name}
                        </span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {profile.badge}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-950 truncate">
                        {profile.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
                        {profile.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 px-1 font-medium">
              <span>*Tersimpan di browser session</span>
              <span className="text-indigo-600 font-bold">Simulasi 3 Role ERP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
