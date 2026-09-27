'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { 
  Building2, 
  Users, 
  DoorOpen, 
  Receipt, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Sparkles,
  User,
  Phone,
  Wifi,
  Zap,
  Check,
  FileCheck2,
  Home,
  ShieldCheck,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Property, Tenant, Invoice, ApiResponse, Contract } from '@/types';
import { useRole } from '@/context/RoleContext';
import { useFeedback } from '@/context/FeedbackContext';
import { SkeletonCard, SkeletonTable, Skeleton, Spinner } from '@/components/ui/skeleton';

export default function DashboardOverviewPage() {
  const { role } = useRole();
  const { showToast, showLoading, hideLoading } = useFeedback();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientKey, setClientKey] = useState('');
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const fetchClientKey = async () => {
    try {
      const res = await api.get<any, ApiResponse<{ clientKey: string }>>('/payments/client-key');
      setClientKey(res.data.clientKey);
    } catch {
      // fallback
    }
  };

  const loadData = async (silent = true) => {
    try {
      setLoading(true);
      if (!silent) showLoading('Memuat ringkasan performa sistem...');
      const [propRes, tenantRes, invRes, contractRes] = await Promise.all([
        api.get<any, ApiResponse<Property[]>>('/properties').catch(() => ({ data: [] })),
        api.get<any, ApiResponse<Tenant[]>>('/tenants').catch(() => ({ data: [] })),
        api.get<any, ApiResponse<Invoice[]>>('/invoices').catch(() => ({ data: [] })),
        api.get<any, ApiResponse<Contract[]>>('/tenants/contracts/all?isActive=true').catch(() => ({ data: [] })),
      ]);
      setProperties(propRes.data || []);
      setTenants(tenantRes.data || []);
      setInvoices(invRes.data || []);
      setContracts(contractRes.data || []);
    } finally {
      setLoading(false);
      if (!silent) hideLoading();
    }
  };

  useEffect(() => {
    fetchClientKey();
    loadData();
  }, []);

  // Super Admin platform metrics
  const allRooms = properties.flatMap((p) => p.rooms || []);
  const totalRoomsAll = allRooms.length;
  const occupiedRoomsAll = allRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableRoomsAll = allRooms.filter((r) => r.status === 'AVAILABLE').length;

  const totalInvoicedAll = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const paidInvoicesAll = invoices.filter((i) => i.status === 'PAID');
  const unpaidInvoicesAll = invoices.filter((i) => i.status === 'UNPAID');
  const totalReceivableAll = unpaidInvoicesAll.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Property Owner metrics (scoped to owned property)
  const ownerProperties = properties.filter((p) => p.name.toLowerCase().includes('harmoni'));
  const ownerRooms = ownerProperties.flatMap((p) => p.rooms || []);
  const ownerTotalRooms = ownerRooms.length;
  const ownerAvailableRooms = ownerRooms.filter((r) => r.status === 'AVAILABLE').length;
  const ownerOccupiedRooms = ownerRooms.filter((r) => r.status === 'OCCUPIED').length;

  const ownerInvoices = invoices.filter((i) => 
    i.contract?.room?.property?.name?.toLowerCase().includes('harmoni')
  );
  const ownerUnpaidInvoices = ownerInvoices.filter((i) => i.status === 'UNPAID');
  const ownerPaidInvoices = ownerInvoices.filter((i) => i.status === 'PAID');
  const ownerTotalReceivable = ownerUnpaidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const ownerTenants = tenants.filter((t) => t.name === 'Budi Santoso');

  // =========================================================================
  // 3. DATA KHUSUS PENYEWA (Budi Santoso)
  // =========================================================================
  const tenantActiveContract = contracts.find((c) => c.tenant?.name === 'Budi Santoso') || contracts[0] || null;
  const tenantInvoices = invoices.filter(
    (inv) => inv.contract?.tenant?.name === 'Budi Santoso' || inv.contractId === tenantActiveContract?.id
  );
  const tenantUnpaidInvoice = tenantInvoices.find((i) => i.status === 'UNPAID') || null;
  const tenantPaidInvoices = tenantInvoices.filter((i) => i.status === 'PAID');

  // Bayar tagihan via Midtrans Snap (Penyewa)
  const handlePay = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      showLoading('Menghubungkan ke Gateway Midtrans Snap...');
      const res = await api.post<any, ApiResponse<{ token: string; redirect_url: string; orderId: string }>>(
        `/payments/create-token/${invoiceId}`,
      );
      const { redirect_url } = res.data;
      hideLoading();

      if (!redirect_url) {
        throw new Error('Gagal mendapatkan sesi pembayaran dari Midtrans Sandbox.');
      }

      window.open(redirect_url, '_blank', 'noopener,noreferrer');
      showToast(
        'info',
        'Halaman Pembayaran Dibuka di Tab Baru',
        'Selesaikan pembayaran di tab Midtrans Sandbox. Sistem akan memverifikasi otomatis setelah Anda kembali ke tab website ini.',
        10000,
      );

      // Polling update status pembayaran di background
      const checkInterval = setInterval(async () => {
        try {
          const statusRes = await api.get<any, ApiResponse<{ isPaid: boolean }>>(`/payments/status/${invoiceId}`);
          if (statusRes.data?.isPaid) {
            clearInterval(checkInterval);
            loadData();
            showToast('success', 'Pembayaran Terverifikasi!', 'Tagihan sewa Anda telah lunas via Midtrans Sandbox.');
          }
        } catch {
          // ignore
        }
      }, 2500);

      setTimeout(() => clearInterval(checkInterval), 250000);
    } catch (err: any) {
      hideLoading();
      showToast('error', 'Gagal Memproses Pembayaran', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setPaymentLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      {/* Skeleton Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-13 h-13 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-44 rounded-lg" />
                <Skeleton className="h-3.5 w-72 rounded-lg" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2.5">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>
              <SkeletonTable rows={4} cols={4} />
            </div>

            <div className="lg:col-span-5 bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <Skeleton className="h-5 w-36 rounded-lg" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. DASHBOARD SUPER ADMIN                                                  */}
          {/* ========================================================================= */}
          {role === 'ADMIN' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner Super Admin */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                  Role: Super Admin • Platform Master
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Pusat Monitoring Platform
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Pengawasan menyeluruh terhadap pendaftaran properti mitra, direktori penyewa, dan audit rekonsiliasi pembayaran se-platform.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/properties"
                className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-all"
              >
                Kelola Properti Mitra
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards Platform Admin (Responsive Mobile Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Properti Platform</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">{properties.length} Properti</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Kos Harmoni & Griya Asri</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Unit Kamar</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">{totalRoomsAll} Unit</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{occupiedRoomsAll} Terisi • {availableRoomsAll} Kosong</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider truncate">Mitra Pemilik</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-900 tracking-tight block truncate">2 Mitra</span>
                <p className="text-[11px] sm:text-xs text-purple-700 mt-1 font-semibold truncate">H. Rahmat & Fatimah</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Volume Platform</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">
                  Rp {totalInvoicedAll.toLocaleString('id-ID')}
                </span>
                <p className="text-[11px] sm:text-xs text-emerald-600 mt-1 font-semibold truncate">{paidInvoicesAll.length} transaksi lunas</p>
              </div>
            </div>
          </div>

          {/* Konten 2 Kolom Super Admin */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Kolom 1: Ringkasan Mitra Pemilik Kos & Properti (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Daftar Mitra Pemilik & Properti
                  </h2>
                  <Link href="/properties" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">Kos Harmoni Residence</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Jakarta Selatan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Mitra Pemilik: H. Rahmat Santoso (0812-9876-5432)</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      3 Unit Kamar
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">Griya Asri Paviliun</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Bandung
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Mitra Pemilik: Ibu Hj. Fatimah (0821-4567-8901)</p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      2 Unit Kamar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 2: Audit Pembayaran Masuk Platform (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Monitoring Transaksi Platform
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {invoices.length} Transaksi
                  </span>
                </div>

                <div className="space-y-2.5">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">{inv.contract?.tenant?.name} • {inv.contract?.room?.property?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">Rp {Number(inv.amount).toLocaleString('id-ID')}</p>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status === 'PAID' ? 'LUNAS' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DASHBOARD PEMILIK KOS (Terisolasi HANYA Kos Harmoni)                   */}
      {/* ========================================================================= */}
      {role === 'OWNER' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner Pemilik Kos */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
                <Home className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                  Role: Pemilik Kos • H. Rahmat Santoso
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Dashboard Kos Harmoni Residence
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Kelola ketersediaan unit kamar, perpanjangan sewa penghuni, dan penagihan sewa bulanan khusus Kos Harmoni Residence.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/properties"
                className="bg-white/90 hover:bg-white text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                + Tambah Kamar
              </Link>
              <Link
                href="/invoices"
                className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                + Buat Tagihan
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards Pemilik Kos Harmoni (Responsive Mobile Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Kamar Kosong</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">{ownerAvailableRooms} Kamar</span>
                <p className="text-[11px] sm:text-xs text-emerald-600 mt-1 font-semibold truncate">Siap sewa (102, 103)</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Kamar Terisi</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">{ownerOccupiedRooms} Kamar</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Kamar 101 (Budi)</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Penyewa Aktif</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">{ownerTenants.length} Orang</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Budi Santoso</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 uppercase tracking-wider truncate">Belum Diterima</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">
                  Rp {ownerTotalReceivable.toLocaleString('id-ID')}
                </span>
                <p className="text-[11px] sm:text-xs text-rose-600 mt-1 font-semibold truncate">{ownerUnpaidInvoices.length} tagihan tertunda</p>
              </div>
            </div>
          </div>

          {/* Konten 2 Kolom Pemilik Kos Harmoni */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Tagihan Sewa Kos Harmoni
                  </h2>
                  <Link href="/invoices" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {ownerInvoices.map((inv) => (
                    <div key={inv.id} className="bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl p-3 flex items-center justify-between text-xs transition-all">
                      <div>
                        <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500">{inv.contract?.tenant?.name} • Kamar {inv.contract?.room?.roomNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">Rp {Number(inv.amount).toLocaleString('id-ID')}</p>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status === 'PAID' ? 'LUNAS' : 'BELUM DIBAYAR'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Tindak Lanjut Operasional
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-900">{ownerAvailableRooms} Kamar Siap Sewa</p>
                      <p className="text-[11px] text-amber-700">Kamar 102 & 103 kosong</p>
                    </div>
                    <Link href="/tenants" className="px-3 py-1 bg-white font-bold text-amber-800 rounded-lg border border-amber-200 shadow-2xs">
                      Sewa
                    </Link>
                  </div>

                  {ownerUnpaidInvoices.length > 0 && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-rose-900">Tagihan INV-202610-002</p>
                        <p className="text-[11px] text-rose-700">Budi Santoso (Rp 1.800.000)</p>
                      </div>
                      <a 
                        href="https://wa.me/6281234567890?text=Halo%20Budi,%20mengingatkan%20tagihan%20sewa%20Kamar%20101%20sebesar%20Rp%201.800.000%20telah%20jatuh%20tempo."
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> WA
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DASHBOARD PENYEWA (Budi Santoso)                                       */}
      {/* ========================================================================= */}
      {role === 'TENANT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Banner Penyewa */}
          <div className="bg-gradient-to-r from-blue-50/90 via-slate-50/80 to-indigo-50/80 backdrop-blur-xl border border-blue-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  Role: Penyewa Kos
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Halo, Budi Santoso 👋
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Ini adalah ringkasan unit kamar kos Anda dan tagihan sewa bulanan yang dapat dibayar langsung secara online.
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shrink-0 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Kamar Anda</p>
              <p className="text-base font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                <DoorOpen className="w-4 h-4 text-indigo-600" />
                Kamar {tenantActiveContract?.room?.roomNumber || '101'}
              </p>
              <p className="text-[11px] text-slate-500">
                {tenantActiveContract?.room?.property?.name || 'Kos Harmoni Residence'}
              </p>
            </div>
          </div>

          {/* 4 Stat Cards Penyewa (Responsive Mobile Grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Unit Kamar</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">Kamar 101</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Lantai 1 • Kos Harmoni</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Biaya Sewa</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight block truncate">Rp 1.800.000</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Per bulan</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Status Sewa</span>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight block truncate">AKTIF</span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">Kontrak resmi</p>
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Tagihan Bulan Ini</span>
              <div className="mt-2">
                <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight block truncate ${tenantUnpaidInvoice ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {tenantUnpaidInvoice ? `Rp ${Number(tenantUnpaidInvoice.amount).toLocaleString('id-ID')}` : 'LUNAS'}
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
                  {tenantUnpaidInvoice ? 'Perlu dibayar' : 'Semua tagihan lunas'}
                </p>
              </div>
            </div>
          </div>

          {/* Rincian Tagihan & Fasilitas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Tagihan Sewa Bulan Ini
                  </h3>
                  {tenantUnpaidInvoice && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      BELUM DIBAYAR
                    </span>
                  )}
                </div>

                {tenantUnpaidInvoice ? (
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Nomor Invoice</span>
                        <p className="font-mono text-sm font-bold text-slate-900">{tenantUnpaidInvoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Jatuh Tempo</span>
                        <p className="text-xs font-bold text-rose-600">
                          {new Date(tenantUnpaidInvoice.dueDate).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium">Total Tagihan</span>
                        <p className="text-xl font-black text-slate-900">
                          Rp {Number(tenantUnpaidInvoice.amount).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={paymentLoading === tenantUnpaidInvoice.id}
                          onClick={() => handlePay(tenantUnpaidInvoice.id)}
                          className="px-4 py-2 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {paymentLoading === tenantUnpaidInvoice.id ? (
                            <Spinner size="sm" className="text-white" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>{paymentLoading === tenantUnpaidInvoice.id ? 'Memproses...' : 'Bayar Sekarang'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-900">Semua Tagihan Anda Telah Lunas</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Terima kasih atas pembayaran tepat waktu.</p>
                  </div>
                )}

                {/* Riwayat Tagihan Lunas */}
                {tenantPaidInvoices.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400" /> Riwayat Pembayaran
                    </h4>
                    <div className="space-y-2">
                      {tenantPaidInvoices.map((inv) => (
                        <div key={inv.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-400">Lunas via Midtrans</p>
                          </div>
                          <span className="font-bold text-emerald-700">Rp {Number(inv.amount).toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fasilitas & Kontak Pemilik Kos (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-600" />
                  Fasilitas Kamar 101
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> AC 1 PK
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-500" /> WiFi Cepat
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Kamar Mandi Dalam
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500" /> Kasur Queen
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs mt-2">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> Pemilik Kos:
                  </p>
                  <p className="text-slate-600 mt-0.5">H. Rahmat Santoso (0812-9876-5432)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
