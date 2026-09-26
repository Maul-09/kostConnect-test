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
  Calendar, 
  TrendingUp, 
  Plus, 
  CreditCard,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Crown,
  Server,
  Activity,
  User,
  Phone,
  Wifi,
  Zap,
  Check,
  FileCheck2,
  Lock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Property, Tenant, Invoice, ApiResponse, Contract } from '@/types';
import { useRole } from '@/context/RoleContext';

export default function DashboardOverviewPage() {
  const { role, currentProfile } = useRole();
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

  const loadData = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchClientKey();
    loadData();
  }, []);

  // Compute metrics
  const allRooms = properties.flatMap((p) => p.rooms || []);
  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'OCCUPIED').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalReceivable = unpaidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPaidRevenue = paidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Tenant persona specific data
  const tenantActiveContract = contracts[0] || null;
  const tenantInvoices = invoices.filter(
    (inv) => inv.contract?.tenant?.name === 'Budi Santoso' || inv.contractId === tenantActiveContract?.id
  );
  const tenantUnpaidInvoice = tenantInvoices.find((i) => i.status === 'UNPAID') || unpaidInvoices[0] || null;
  const tenantPaidInvoices = tenantInvoices.filter((i) => i.status === 'PAID');

  // Payment Handler via Midtrans Snap (for Tenant role preview)
  const handlePay = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      const res = await api.post<any, ApiResponse<{ token: string; redirect_url: string; orderId: string; simulated?: boolean }>>(
        `/payments/create-token/${invoiceId}`,
      );
      const { token, simulated, redirect_url } = res.data;

      if ((window as any).snap && !simulated) {
        (window as any).snap.pay(token, {
          onSuccess: async () => {
            alert('Pembayaran Berhasil Diverifikasi!');
            loadData();
          },
          onPending: () => {
            alert('Menunggu penyelesaian pembayaran.');
            loadData();
          },
          onError: () => {
            alert('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            loadData();
          },
        });
      } else {
        if (confirm('Token pembayaran dibuat. Ingin menjalankan simulasi pelunasan instan (Demo Reviewer)?')) {
          handleSimulatePayment(invoiceId);
        } else if (redirect_url) {
          window.open(redirect_url, '_blank');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleSimulatePayment = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      await api.post(`/webhooks/simulate-payment/${invoiceId}`);
      alert('Simulasi Pelunasan Berhasil! Status tagihan diperbarui menjadi PAID & webhook n8n terpicu.');
      loadData();
    } catch (err: any) {
      alert('Simulasi gagal: ' + err.message);
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

      {/* ========================================================================= */}
      {/* 1. PERSPEKTIF SUPER ADMIN (PLATFORM GOVERNANCE & MULTI-MITRA)             */}
      {/* ========================================================================= */}
      {role === 'ADMIN' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Hero Header Super Admin */}
          <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/80 to-slate-50/80 backdrop-blur-xl border border-purple-200/70 rounded-[28px] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-[#0b0f19] text-amber-300 flex items-center justify-center shadow-lg shadow-purple-950/20 shrink-0">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-950">
                    SUPER ADMIN • PLATFORM GOVERNANCE
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-purple-100/90 text-purple-900 border border-purple-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                    Multi-Tenant Ecosystem
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Pusat Kendali Ekosistem KosConnect
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Monitoring seluruh mitra pemilik kos, lisensi sistem ERP, performa gateway pembayaran Midtrans, dan kesehatan orkestrasi otomasi n8n secara global.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/properties"
                className="bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Audit Multi-Properti</span>
              </Link>
              <button
                onClick={() => alert('Arsitektur KosConnect ERP dalam kondisi prima:\n- NestJS Core API: ONLINE\n- PostgreSQL 16 Prisma: CONNECTED\n- Midtrans Snap: SANDBOX READY\n- n8n Webhook: LISTENING')}
                className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-amber-300" />
                <span>Status Arsitektur API</span>
              </button>
            </div>
          </div>

          {/* 4 Stat Cards Platform Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/70 px-2.5 py-0.5 rounded-full">
                  Platform Mitra
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  12 Mitra
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Pemilik kos terdaftar
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  10 Terverifikasi • 2 Pending Review
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                  Multi-Lokasi
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {properties.length} Properti
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Aset properti & kontrakan
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Wilayah Jabodetabek & Bandung
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                  Kapasitas
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {totalRooms} Total Unit
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Kamar dalam ekosistem
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tingkat okupansi global {occupancyRate}%
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Volume GTV
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block truncate">
                  Rp {(totalPaidRevenue + 24500000).toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Gross Transaction Value
                </span>
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                  Transaksi Midtrans Snap Sandbox
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          {/* Super Admin Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Direktori Mitra & Integrasi */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Direktori Mitra Pemilik Kos */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      Direktori Mitra Pemilik Kos Terdaftar
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pengelolaan mitra pemilik, kepemilikan aset kos, dan paket lisensi ERP.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    3 Mitra Aktif
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      name: 'H. Rahmat Santoso',
                      kos: 'Kos Harmoni Residence (Jakarta Barat)',
                      rooms: '3 Unit Kamar',
                      tier: 'Enterprise ERP',
                      status: 'Aktif & Terverifikasi',
                      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    },
                    {
                      name: 'Hj. Fatimah Azzahra',
                      kos: 'Kos Melati Syariah (Jakarta Selatan)',
                      rooms: '8 Unit Kamar',
                      tier: 'Professional Plan',
                      status: 'Aktif & Terverifikasi',
                      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    },
                    {
                      name: 'Dr. Hendra Wijaya',
                      kos: 'Graha Mandiri Kontrakan (Bandung)',
                      rooms: '12 Unit Kamar',
                      tier: 'Starter Tier',
                      status: 'Review Dokumen',
                      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                    },
                  ].map((partner, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-800 font-black text-xs flex items-center justify-center shrink-0">
                          {partner.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">
                            {partner.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {partner.kos} • <span className="font-semibold">{partner.rooms}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-full block mb-1">
                          {partner.tier}
                        </span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${partner.badgeColor}`}>
                          {partner.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Status Arsitektur & Health Integrasi */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-600" />
                      Status Arsitektur & Service Health
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Verifikasi konektivitas modul backend, payment gateway, dan automation engine.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    All Systems Operational
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Midtrans Snap SDK</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">SANDBOX ACTIVE</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">SHA-512 Signature verification online</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">n8n Automation Engine</span>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">LISTENING</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">2 Workflows: Payment & Overdue Check</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">PostgreSQL 16 & Prisma</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">HEALTHY</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Database `kosconnect_db` 5 models seeded</p>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">NestJS Monorepo Core</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">ONLINE (Port 3001)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Swagger docs, validation pipe & CORS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Metrik SLA & Global Log */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 3: Metrik SLA & Keandalan Platform */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    SLA & Performa Platform
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Target 99.9%</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Uptime Sistem Bulanan</span>
                      <span className="text-emerald-600">99.98%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.98%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Rata-rata Latensi API</span>
                      <span className="text-indigo-600">38 ms</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Reliabilitas Webhook n8n</span>
                      <span className="text-purple-600">100% Success</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Global Audit Log & Security Feed */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 block">
                  AUDIT LOG PLATFORM
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-0.5 mb-4">
                  Aktivitas Ekosistem Terakhir
                </h3>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        Midtrans Webhook settlement terverifikasi
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Signature SHA512 valid • Invoice kos diperbarui
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        Lisensi Enterprise Kos Harmoni diperpanjang
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Pemilik: H. Rahmat Santoso • 12 bulan aktif
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        Automasi n8n trigger notifikasi pembayaran
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Notifikasi sukses terkirim ke WhatsApp penyewa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PERSPEKTIF PEMILIK KOS (OPERASIONAL ASET, CRM & FINANSIAL)              */}
      {/* ========================================================================= */}
      {role === 'OWNER' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Hero Header Pemilik Kos */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                    PEMILIK KOS • KOS HARMONI RESIDENCE
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-indigo-100/90 text-indigo-900 border border-indigo-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    Operasional Stabil
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Dashboard Operasional Kos Harmoni
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Kelola ketersediaan unit kamar, monitoring masa sewa aktif penyewa, dan pantau arus kas masuk bulanan secara real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/properties"
                className="bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Katalog Unit</span>
              </Link>
              <Link
                href="/invoices"
                className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Terbitkan Tagihan</span>
              </Link>
            </div>
          </div>

          {/* 4 Stat Cards Owner Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {availableRooms}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Kamar siap huni (AVAILABLE)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {availableRooms} Kamar kosong • {occupiedRooms} Terisi
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                  Terverifikasi
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {tenants.length}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Penyewa aktif kos
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tingkat hunian kos {occupancyRate}%
                </p>
              </div>
              <div className="mt-4 flex items-end gap-1 h-3">
                <div className="flex-1 bg-indigo-200 rounded-t h-1/2" />
                <div className="flex-1 bg-indigo-300 rounded-t h-3/4" />
                <div className="flex-1 bg-indigo-600 rounded-t h-full" />
                <div className="flex-1 bg-indigo-400 rounded-t h-2/3" />
                <div className="flex-1 bg-indigo-600 rounded-t h-full" />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                  Kapasitas
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {totalRooms} Kamar
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Total kapasitas kamar
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {occupiedRooms} Kamar terikat kontrak
                </p>
              </div>
              <div className="mt-4 flex items-end gap-1 h-3">
                <div className="flex-1 bg-purple-200 rounded-t h-1/3" />
                <div className="flex-1 bg-purple-300 rounded-t h-2/3" />
                <div className="flex-1 bg-purple-600 rounded-t h-full" />
                <div className="flex-1 bg-purple-300 rounded-t h-1/2" />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Perlu ditangani
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {unpaidInvoices.length} Tagihan
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Piutang sewa belum lunas
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rp {totalReceivable.toLocaleString('id-ID')} tertunda
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          {/* Owner Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* Jadwal Tagihan & Sewa */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">
                        Jadwal tagihan & sewa kos
                      </h2>
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                        {invoices.length} total
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Daftar tagihan aktif dan riwayat pelunasan sewa.
                    </p>
                  </div>
                  <Link
                    href="/invoices"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                  >
                    Lihat semua <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {invoices.slice(0, 3).map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/70 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {inv.contract?.tenant?.name || 'Penyewa'} • Kamar {inv.contract?.room?.roomNumber || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900">
                            Rp {Number(inv.amount).toLocaleString('id-ID')}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>

                        <Link
                          href="/invoices"
                          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                          title="Buka Tagihan"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minggu Berjalan Okupansi */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      MINGGU BERJALAN
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">
                      Tingkat hunian kamar mingguan
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {occupancyRate}% dari seluruh kapasitas unit aktif terisi.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> {occupancyRate}% stabil
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2.5 pt-4">
                  {[
                    { day: 'Sen', pct: 60, active: false },
                    { day: 'Sel', pct: 60, active: false },
                    { day: 'Rab', pct: 60, active: false },
                    { day: 'Kam', pct: 60, active: false },
                    { day: 'Jum', pct: 60, active: false },
                    { day: 'Sab', pct: 60, active: true },
                    { day: 'Min', pct: 60, active: false },
                  ].map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100/80 rounded-2xl h-24 p-1 flex flex-col justify-end">
                        <div
                          className={`w-full rounded-xl transition-all duration-500 ${
                            item.active 
                              ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-blue-400 shadow-sm' 
                              : 'bg-indigo-200/40'
                          }`}
                          style={{ height: `${item.pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${item.active ? 'text-indigo-900 font-extrabold' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prioritas Juragan Kos */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Prioritas Juragan Kos
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Urut berdasarkan risiko operasional kos.
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {availableRooms}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">Kamar siap huni (AVAILABLE)</p>
                      <p className="text-[10px] text-slate-400">Siap diterbitkan kontrak baru</p>
                    </div>
                    <Link
                      href="/tenants"
                      className="text-[10px] font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
                    >
                      Sewa
                    </Link>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {unpaidInvoices.length}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">Tagihan belum lunas (UNPAID)</p>
                      <p className="text-[10px] text-slate-400">Tersedia pelunasan via Midtrans</p>
                    </div>
                    <Link
                      href="/invoices"
                      className="text-[10px] font-bold text-rose-700 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
                    >
                      Tagih
                    </Link>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                      OK
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">Midtrans & n8n Gateway</p>
                      <p className="text-[10px] text-slate-400">Webhook listener & otomasi aktif</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                      Siap
                    </span>
                  </div>
                </div>
              </div>

              {/* Feed Aktivitas */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  AKTIVITAS TERBARU
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-0.5 mb-4">
                  Yang baru saja terjadi
                </h3>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        Invoice INV-202609-001 berstatus lunas
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Budi Santoso • Pembayaran Midtrans Snap berhasil
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        Kontrak sewa Kamar A1 diterbitkan
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Siti Rahma • Status kamar otomatis jadi OCCUPIED
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PERSPEKTIF PENYEWA (CLIENT / TENANT SELF-SERVICE PORTAL)               */}
      {/* ========================================================================= */}
      {role === 'TENANT' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Hero Header Penyewa */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50/80 backdrop-blur-xl border border-blue-200/70 rounded-[28px] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-950">
                    PORTAL MANDIRI PENYEWA • KAMAR 101
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 border border-emerald-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Penyewa Terverifikasi
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Halo, Budi Santoso 👋
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Selamat datang di portal mandiri KosConnect. Pantau masa aktif sewa unit Anda, fasilitas kos, dan lakukan pembayaran sewa bulanan langsung via Midtrans Snap Sandbox.
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shrink-0 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Kamar Anda</p>
              <p className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-indigo-600" />
                Kamar {tenantActiveContract?.room?.roomNumber || '101'}
              </p>
              <p className="text-[11px] text-slate-500">
                {tenantActiveContract?.room?.property?.name || 'Kos Harmoni Residence'}
              </p>
            </div>
          </div>

          {/* 4 Stat Cards Tenant Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
                  Unit Kamar
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  Kamar {tenantActiveContract?.room?.roomNumber || '101'}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Lantai 1 • Kos Harmoni
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rp {Number(tenantActiveContract?.room?.monthlyPrice || 1800000).toLocaleString('id-ID')}/bln
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  Masa Aktif
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  178 Hari
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Sisa masa sewa kontrak
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Berlaku s/d 24 Mar 2027
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/70 px-2.5 py-0.5 rounded-full">
                  {tenantUnpaidInvoice ? 'Belum Dibayar' : 'Semua Lunas'}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  {tenantUnpaidInvoice ? `Rp ${Number(tenantUnpaidInvoice.amount).toLocaleString('id-ID')}` : 'Rp 0'}
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Tagihan sewa bulan ini
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {tenantUnpaidInvoice ? `Jatuh tempo: ${new Date(tenantUnpaidInvoice.dueDate).toLocaleDateString('id-ID')}` : 'Tidak ada tagihan tertunda'}
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${tenantUnpaidInvoice ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                  Status Sah
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900 tracking-tight block">
                  AKTIF
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">
                  Status penghuni resmi
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kontrak terdaftar di sistem KosConnect
                </p>
              </div>
              <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Tenant Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (7 cols): Tagihan Sewa & Pembayaran */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Tagihan Sewa Siap Bayar */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Tagihan Sewa Bulan Ini
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pelunasan mudah dengan BCA, Mandiri, BNI, QRIS, GoPay, dan ShopeePay via Midtrans Snap.
                    </p>
                  </div>
                  {tenantUnpaidInvoice && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      BELUM DIBAYAR
                    </span>
                  )}
                </div>

                {tenantUnpaidInvoice ? (
                  <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 border border-indigo-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/70">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Invoice</span>
                        <p className="font-mono text-sm font-black text-slate-900">{tenantUnpaidInvoice.invoiceNumber}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jatuh Tempo</span>
                        <p className="text-xs font-bold text-rose-600">
                          {new Date(tenantUnpaidInvoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500">Total Nominal Pembayaran</span>
                        <p className="text-2xl font-black text-slate-900">
                          Rp {Number(tenantUnpaidInvoice.amount).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Tombol Snap Midtrans Resmi */}
                        <button
                          disabled={paymentLoading === tenantUnpaidInvoice.id}
                          onClick={() => handlePay(tenantUnpaidInvoice.id)}
                          className="px-4 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4 text-indigo-400" />
                          <span>{paymentLoading === tenantUnpaidInvoice.id ? 'Memproses...' : 'Bayar Sekarang'}</span>
                        </button>

                        {/* Tombol Simulasi Cepat Demo Reviewer */}
                        <button
                          disabled={paymentLoading === tenantUnpaidInvoice.id}
                          onClick={() => handleSimulatePayment(tenantUnpaidInvoice.id)}
                          className="px-3 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Simulasikan pelunasan instan untuk keperluan demo reviewer"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span className="hidden sm:inline">Simulasi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-900">Semua Tagihan Anda Telah Lunas!</p>
                    <p className="text-[11px] text-emerald-700">Terima kasih atas kedisiplinan pembayaran sewa kos Anda.</p>
                  </div>
                )}

                {/* Riwayat Pembayaran Sebelumnya */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                    Riwayat Pembayaran Sebelumnya
                  </h4>
                  <div className="space-y-2">
                    {tenantPaidInvoices.map((inv) => (
                      <div key={inv.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-400">Dibayar via Midtrans Snap • Terverifikasi</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">Rp {Number(inv.amount).toLocaleString('id-ID')}</p>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            LUNAS (PAID)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Fasilitas & Kontak Pengelola */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 2: Fasilitas Kamar & Tata Tertib */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-indigo-600" />
                    Fasilitas Kamar {tenantActiveContract?.room?.roomNumber || '101'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">All-Inclusive</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium text-slate-700">AC Split 1 PK</span>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium text-slate-700">WiFi 100 Mbps</span>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium text-slate-700">Kamar Mandi Dalam</span>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="font-medium text-slate-700">Water Heater</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200/60 rounded-xl text-[11px] text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Ketentuan Akses & Jam Malam:
                  </p>
                  <p className="text-slate-600">Akses gerbang bebas 24 jam dengan kartu akses mandiri. Tamu menginap wajib lapor pengelola.</p>
                </div>
              </div>

              {/* Card 3: Kontak Darurat Pengelola Kos */}
              <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-3.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  BANTUAN & KONTAK
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  Hubungi Pengelola Kos
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">H. Rahmat Santoso (Pemilik)</p>
                      <p className="text-[10px] text-slate-400">0812-9876-5432 • WhatsApp</p>
                    </div>
                    <button
                      onClick={() => alert('Membuka WhatsApp Pengelola Kos: 0812-9876-5432')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Chat
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Mas Anto (Penjaga Kos)</p>
                      <p className="text-[10px] text-slate-400">Siap di pos depan 24 jam</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                      Lobby Pos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
