'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { api } from '@/lib/api';
import { Invoice, Contract, ApiResponse } from '@/types';
import { 
  User, 
  DoorOpen, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2, 
  Sparkles, 
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Phone,
  Mail
} from 'lucide-react';
import { Skeleton, SkeletonCard, Spinner } from '@/components/ui/skeleton';

declare global {
  interface Window {
    snap?: any;
  }
}

export default function TenantPortalPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
      const [contractsRes, invoicesRes] = await Promise.all([
        api.get<any, ApiResponse<Contract[]>>('/tenants/contracts/all?isActive=true'),
        api.get<any, ApiResponse<Invoice[]>>('/invoices'),
      ]);
      setContracts(contractsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientKey();
    loadData();
  }, []);

  // Use Budi Santoso as the demo active tenant persona
  const activeContract = contracts[0] || null;
  const tenantInvoices = invoices.filter(
    (inv) => inv.contract?.tenant?.name === activeContract?.tenant?.name || inv.contractId === activeContract?.id
  );
  const unpaidTenantInvoices = tenantInvoices.filter((i) => i.status === 'UNPAID');

  const handlePay = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      const res = await api.post<any, ApiResponse<{ token: string; redirect_url: string; orderId: string; simulated?: boolean }>>(
        `/payments/create-token/${invoiceId}`,
      );

      const { token, simulated, redirect_url } = res.data;

      if (window.snap && !simulated) {
        window.snap.pay(token, {
          onSuccess: async () => {
            alert('Pembayaran Berhasil! Terima kasih telah melunasi sewa kos.');
            loadData();
          },
          onPending: () => {
            alert('Menunggu penyelesaian pembayaran.');
            loadData();
          },
          onError: (err: any) => {
            alert('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            loadData();
          },
        });
      } else {
        if (confirm('Token dibuat. Jalankan simulasi pelunasan langsung untuk demo reviewer?')) {
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

      {/* Skeleton loading state */}
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
            <Skeleton className="h-16 w-40 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <div className="space-y-3 pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>

            <div className="lg:col-span-2 bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-lg" />
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
          {/* 1. Hero Banner: Tenant Greeting */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50/80 backdrop-blur-xl border border-blue-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-950">
                PORTAL PENYEWA
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 border border-emerald-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Penyewa Terverifikasi
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Halo, {activeContract?.tenant?.name || 'Budi Santoso'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Selamat datang di portal mandiri penyewa KosConnect. Pantau masa aktif kontrak sewa dan bayar tagihan bulanan langsung via Midtrans Snap.
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shrink-0 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Kamar Anda</p>
          <p className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
            <DoorOpen className="w-4 h-4 text-indigo-600" />
            Kamar {activeContract?.room?.roomNumber || '101'}
          </p>
          <p className="text-[11px] text-slate-500">
            {activeContract?.room?.property?.name || 'Kos Harmoni Residence'}
          </p>
        </div>
      </div>

      {/* 2. Grid: Contract Info & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Kontrak Sewa Card */}
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Detail Kontrak Sewa
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              AKTIF
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Properti:</span>
              <span className="font-bold text-slate-800">{activeContract?.room?.property?.name || 'Kos Harmoni Residence'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tarif Sewa:</span>
              <span className="font-black text-slate-900 text-sm">
                Rp {Number(activeContract?.room?.monthlyPrice || 1800000).toLocaleString('id-ID')} / bulan
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Periode Kontrak:</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {activeContract?.startDate ? new Date(activeContract.startDate).toLocaleDateString('id-ID') : '26/09/2026'} s/d{' '}
                {activeContract?.endDate ? new Date(activeContract.endDate).toLocaleDateString('id-ID') : '26/03/2027'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Kontak WhatsApp:</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {activeContract?.tenant?.phone || '081234567890'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Tagihan Sewa Anda (2 Cols) */}
        <div className="lg:col-span-2 bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Tagihan Sewa Saya
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Riwayat dan tagihan sewa berjalan yang perlu diselesaikan.
              </p>
            </div>
            {unpaidTenantInvoices.length > 0 ? (
              <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                {unpaidTenantInvoices.length} Perlu Dibayar
              </span>
            ) : (
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
              </span>
            )}
          </div>

          {/* List of tenant's invoices */}
          <div className="space-y-3">
            {tenantInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                Tidak ada tagihan sewa yang terdaftar untuk akun Anda.
              </div>
            ) : (
              tenantInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID';
                const isPaying = paymentLoading === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPaid ? 'LUNAS (PAID)' : 'BELUM DIBAYAR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Jatuh tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block">Nominal:</span>
                        <span className="font-black text-sm text-slate-900">
                          Rp {Number(inv.amount).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" /> Terbayar
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isPaying}
                            onClick={() => handlePay(inv.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            {isPaying ? <Spinner size="sm" className="text-white" /> : <CreditCard className="w-3.5 h-3.5 text-indigo-400" />}
                            {isPaying ? 'Memproses...' : 'Bayar Sekarang'}
                          </button>
                          <button
                            disabled={isPaying}
                            onClick={() => handleSimulatePayment(inv.id)}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Simulasi Lunas Cepat (Demo)"
                          >
                            {isPaying ? <Spinner size="sm" className="text-indigo-600" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
