'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { Property, Tenant, Invoice, ApiResponse } from '@/types';

export default function DashboardOverviewPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [propRes, tenantRes, invRes] = await Promise.all([
          api.get<any, ApiResponse<Property[]>>('/properties').catch(() => ({ data: [] })),
          api.get<any, ApiResponse<Tenant[]>>('/tenants').catch(() => ({ data: [] })),
          api.get<any, ApiResponse<Invoice[]>>('/invoices').catch(() => ({ data: [] })),
        ]);
        setProperties(propRes.data || []);
        setTenants(tenantRes.data || []);
        setInvoices(invRes.data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner ("Pusat Kendali - Operasional Stabil") */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                PUSAT KENDALI OPERASIONAL
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-100/90 text-indigo-900 border border-indigo-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Sistem aktif & stabil
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Ringkasan Operasional Properti
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Pantau ketersediaan unit kamar, kontrak aktif penyewa, dan arus kas pembayaran sewa dalam satu ruang kerja terpadu.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
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

      {/* 2. Top 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kamar Siap Huni */}
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
              Kamar siap huni
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              {availableRooms} AVAILABLE • {occupiedRooms} OCCUPIED
            </p>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Penyewa Aktif */}
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
              Penyewa aktif
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Kelola di menu CRM Penyewa
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

        {/* Card 3: Total Unit Kamar */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
              2 properti
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-slate-900 tracking-tight block">
              {totalRooms}
            </span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">
              Total kapasitas kamar
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Tingkat okupansi {occupancyRate}%
            </p>
          </div>
          <div className="mt-4 flex items-end gap-1 h-3">
            <div className="flex-1 bg-purple-200 rounded-t h-1/3" />
            <div className="flex-1 bg-purple-300 rounded-t h-2/3" />
            <div className="flex-1 bg-purple-600 rounded-t h-full" />
            <div className="flex-1 bg-purple-300 rounded-t h-1/2" />
          </div>
        </div>

        {/* Card 4: Perlu Tindakan (Amber Alert) */}
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
              {unpaidInvoices.length}
            </span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">
              Tagihan belum lunas
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

      {/* 3. Main Content Split: 2 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 of 12 cols): Jadwal & Okupansi */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Jadwal Tagihan Hari Ini */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">
                    Jadwal tagihan & sewa
                  </h2>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                    {invoices.length} total
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sabtu, 26 September 2026 • Asia/Jakarta
                </p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
              >
                Lihat semua <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Invoices List */}
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

          {/* Card: Minggu Berjalan (Grafik Okupansi Kamar) */}
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

            {/* Horizontal Weekday Bars with Indigo Royal Palette */}
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

        {/* Right Column (5 of 12 cols): Prioritas Admin & Feed Aktivitas */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Prioritas Admin */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Prioritas admin
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Urut berdasarkan risiko operasional dan jatuh tempo.
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            {/* Priority Items */}
            <div className="space-y-3">
              {/* Item 1 */}
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

              {/* Item 2 */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {unpaidInvoices.length}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Tagihan belum lunas (UNPAID)</p>
                  <p className="text-[10px] text-slate-400">Tersedia pelunasan via Midtrans Snap</p>
                </div>
                <Link
                  href="/invoices"
                  className="text-[10px] font-bold text-rose-700 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
                >
                  Tagih
                </Link>
              </div>

              {/* Item 3 */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {occupiedRooms}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Kontrak sewa aktif</p>
                  <p className="text-[10px] text-slate-400">Unit kamar terisi dan terikat kontrak</p>
                </div>
                <Link
                  href="/tenants"
                  className="text-[10px] font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
                >
                  Lihat
                </Link>
              </div>

              {/* Item 4 */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  OK
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">Midtrans & n8n Automation</p>
                  <p className="text-[10px] text-slate-400">Webhook listener & gateway siap</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                  Siap
                </span>
              </div>
            </div>
          </div>

          {/* Card: Aktivitas Terbaru (Feed) */}
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

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    Webhook n8n di-trigger otomatis
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Dispatch notifikasi pembayaran invoice lunas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
