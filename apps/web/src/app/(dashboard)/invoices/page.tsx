'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { api } from '@/lib/api';
import { Invoice, Contract, ApiResponse, ExchangeRate } from '@/types';
import { useRole } from '@/context/RoleContext';
import { useFeedback } from '@/context/FeedbackContext';
import { useNotification } from '@/context/NotificationContext';
import { formatNumberWithDots, parseNumberFromDots } from '@/lib/utils';

import { 
  Receipt, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  X, 
  FileCheck2,
  ShieldCheck,
  Send,
  MessageCircle,
  Building2,
  Lock,
  Globe
} from 'lucide-react';
import { SkeletonCard, SkeletonTable, Spinner } from '@/components/ui/skeleton';

declare global {
  interface Window {
    snap?: any;
  }
}

export default function InvoicesPage() {
  const { role, setRole } = useRole();
  const { showToast, showLoading, hideLoading, showConfirm } = useFeedback();
  const { triggerPaymentSuccess, addNotification } = useNotification();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientKey, setClientKey] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // External Currency API state
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);

  // Invoice creation form modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [amount, setAmount] = useState('1.800.000');
  const [dueDate, setDueDate] = useState('');

  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchClientKey = async () => {
    try {
      const res = await api.get<any, ApiResponse<{ clientKey: string }>>('/payments/client-key');
      setClientKey(res.data.clientKey);
    } catch {
      // fallback
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const res = await api.get<any, ApiResponse<ExchangeRate>>('/currency/rates');
      if (res.data) {
        setExchangeRate(res.data);
      }
    } catch {
      // fallback
    }
  };

  const formatMoney = (val: number | string) => {
    const num = Number(val) || 0;
    if (currency === 'USD') {
      const rate = exchangeRate?.rate || 16250;
      const usd = num / rate;
      return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const loadData = async (silent = true) => {
    try {
      setLoading(true);
      if (!silent) showLoading('Memuat daftar tagihan & riwayat transaksi...');
      const url = statusFilter === 'ALL' ? '/invoices' : `/invoices?status=${statusFilter}`;
      const [invRes, contractRes] = await Promise.all([
        api.get<any, ApiResponse<Invoice[]>>(url),
        api.get<any, ApiResponse<Contract[]>>('/tenants/contracts/all?isActive=true'),
      ]);
      setInvoices(invRes.data);
      setContracts(contractRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data tagihan');
    } finally {
      setLoading(false);
      if (!silent) hideLoading();
    }
  };

  useEffect(() => {
    fetchClientKey();
    fetchExchangeRate();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split('T')[0]);

    // Deteksi otomatis jika pengguna baru saja kembali dari redirect Midtrans (Finish URL)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('order_id');
      const transactionStatus = urlParams.get('transaction_status');
      const statusCode = urlParams.get('status_code');

      if (orderId && (transactionStatus === 'settlement' || transactionStatus === 'capture' || statusCode === '200')) {
        window.history.replaceState({}, '', window.location.pathname);

        api.get<any, ApiResponse<Invoice[]>>('/invoices').then((res) => {
          const invList = res.data || [];
          setInvoices(invList);
          const matched = invList.find(
            (i) => i.midtransOrderId === orderId || orderId.includes(i.invoiceNumber)
          );
          if (matched) {
            handleCheckStatus(matched.id);
          } else {
            loadData(true);
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [statusFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId) {
      showToast('warning', 'Kontrak Belum Dipilih', 'Pilih kontrak sewa aktif terlebih dahulu.');
      return;
    }
    try {
      setSubmitting(true);
      showLoading('Menerbitkan invoice tagihan sewa baru...');
      await api.post('/invoices', {
        contractId: selectedContractId,
        amount: parseNumberFromDots(amount),
        dueDate: new Date(dueDate).toISOString(),
      });
      setShowCreateModal(false);
      setSelectedContractId('');
      setAmount('1.800.000');
      loadData();
      showToast('success', 'Invoice Berhasil Diterbitkan', 'Tagihan sewa siap dibayarkan via Midtrans Snap.');

      // Kirimkan notifikasi ke Notification feed
      addNotification({
        category: 'invoice',
        title: 'Invoice Tagihan Baru Diterbitkan',
        desc: `Tagihan sewa senilai Rp ${amount} telah berhasil dibuat untuk kontrak penghuni terpilih.`,
        meta: {
          amount: parseNumberFromDots(amount),
          actionUrl: '/invoices',
          actionLabel: 'Buka Tagihan',
        },
      });
    } catch (err: any) {
      showToast('error', 'Gagal Menerbitkan Invoice', err.message);
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  // Polling latar belakang aktif untuk mendeteksi penyelesaian transaksi di Midtrans
  const startPaymentPolling = (invoiceId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 35; // 35 * 2.5s = ~87 seconds

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        return;
      }

      try {
        const res = await api.get<any, ApiResponse<{ isPaid: boolean; status: string; message?: string }>>(
          `/payments/status/${invoiceId}`
        );

        if (res.data?.isPaid) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

          // Silent reload
          const invRes = await api.get<any, ApiResponse<Invoice[]>>('/invoices');
          setInvoices(invRes.data || []);
          const targetInv = (invRes.data || []).find((i) => i.id === invoiceId) || invoices.find((i) => i.id === invoiceId);

          // Tampilkan Modal Perayaan Sukses Pembayaran
          triggerPaymentSuccess({
            invoiceNumber: targetInv?.invoiceNumber || 'INV-2026-001',
            amount: Number(targetInv?.amount || 1800000),
            tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
            roomNumber: targetInv?.contract?.room?.roomNumber || '101',
            propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
            paymentMethod: 'Midtrans Snap Gateway (Settlement)',
          });

          showToast('success', 'Pembayaran Terverifikasi!', 'Tagihan sewa Anda sudah tercatat LUNAS di sistem.');

          addNotification({
            category: 'payment',
            title: 'Pembayaran Sewa Kamar Berhasil Lunas',
            desc: `Pembayaran sewa ${targetInv?.contract?.room?.property?.name || 'Kos Harmoni'} kamar ${targetInv?.contract?.room?.roomNumber || '101'} senilai ${formatMoney(targetInv?.amount || 1800000)} telah lunas via Midtrans Snap.`,
            meta: {
              invoiceNumber: targetInv?.invoiceNumber,
              amount: Number(targetInv?.amount || 1800000),
              tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
              roomNumber: targetInv?.contract?.room?.roomNumber || '101',
              propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
              actionUrl: '/invoices',
              actionLabel: 'Lihat Bukti Pembayaran',
            },
          });
        }
      } catch {
        // Silently continue polling
      }
    }, 2500);
  };

  // Payment Handler — Buka Midtrans Snap di tab baru via redirect_url
  const handlePay = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      showLoading('Menyiapkan halaman pembayaran Midtrans Snap...');
      const res = await api.post<any, ApiResponse<{ token: string; redirect_url: string; orderId: string; simulated?: boolean }>>(
        `/payments/create-token/${invoiceId}`,
      );

      const { simulated, redirect_url } = res.data;
      hideLoading();

      // KASUS 1: Mode Simulasi (Midtrans belum dikonfigurasi / kredensial sandbox belum diisi)
      // Langsung jalankan simulasi internal tanpa membuka tab baru
      if (simulated || !redirect_url) {
        showToast('info', 'Mode Simulasi Aktif', 'Menjalankan simulasi pelunasan instan (Midtrans Sandbox belum dikonfigurasi)...');
        await handleSimulatePayment(invoiceId);
        return;
      }

      // KASUS 2: Token Midtrans nyata tersedia — buka halaman pembayaran Snap di TAB BARU
      window.open(redirect_url, '_blank', 'noopener,noreferrer');
      showToast(
        'info',
        'Halaman Pembayaran Dibuka di Tab Baru',
        'Selesaikan pembayaran di tab Midtrans yang baru terbuka. Sistem akan memverifikasi dan memperbarui status secara otomatis.',
        8000,
      );

      // Mulai polling otomatis di background setiap 2.5 detik
      startPaymentPolling(invoiceId);

    } catch (err: any) {
      hideLoading();
      showToast('error', 'Gagal Memproses Pembayaran', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setPaymentLoading(null);
    }
  };

  // Simulasi pelunasan instan (Demo Reviewer / tanpa kredensial Midtrans aktif)
  const handleSimulatePayment = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      showLoading('Memverifikasi simulasi pembayaran Midtrans...');
      await api.post(`/webhooks/simulate-payment/${invoiceId}`);
      
      const invRes = await api.get<any, ApiResponse<Invoice[]>>('/invoices');
      setInvoices(invRes.data || []);
      const targetInv = (invRes.data || []).find((i) => i.id === invoiceId) || invoices.find((i) => i.id === invoiceId);

      hideLoading();

      // Tampilkan Modal Perayaan Sukses Pembayaran
      triggerPaymentSuccess({
        invoiceNumber: targetInv?.invoiceNumber || 'INV-2026-001',
        amount: Number(targetInv?.amount || 1800000),
        tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
        roomNumber: targetInv?.contract?.room?.roomNumber || '101',
        propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
        paymentMethod: 'Midtrans Sandbox (Simulasi Instan)',
      });

      showToast('success', 'Pelunasan Berhasil Diverifikasi', 'Status invoice berubah menjadi PAID.');

      addNotification({
        category: 'payment',
        title: 'Pembayaran Sewa Kamar Berhasil Lunas',
        desc: `Pembayaran sewa ${targetInv?.contract?.room?.property?.name || 'Kos Harmoni'} kamar ${targetInv?.contract?.room?.roomNumber || '101'} senilai ${formatMoney(targetInv?.amount || 1800000)} telah lunas diverifikasi.`,
        meta: {
          invoiceNumber: targetInv?.invoiceNumber,
          amount: Number(targetInv?.amount || 1800000),
          tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
          roomNumber: targetInv?.contract?.room?.roomNumber || '101',
          propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
          actionUrl: '/invoices',
          actionLabel: 'Lihat Bukti Pembayaran',
        },
      });
    } catch (err: any) {
      hideLoading();
      showToast('error', 'Simulasi Pelunasan Gagal', err.message);
    } finally {
      setPaymentLoading(null);
    }
  };

  // Cek & sinkronisasi status langsung ke server Midtrans (solusi ideal localhost tanpa tunnel)
  const handleCheckStatus = async (invoiceId: string) => {
    try {
      setPaymentLoading(invoiceId);
      showLoading('Mengecek status pembayaran ke Midtrans...');
      const res = await api.get<any, ApiResponse<{ isPaid: boolean; status: string; message?: string }>>(
        `/payments/status/${invoiceId}`,
      );

      // Refresh data tagihan secara silent agar tidak memunculkan overlay modal ganda
      const invRes = await api.get<any, ApiResponse<Invoice[]>>('/invoices');
      setInvoices(invRes.data || []);
      const targetInv = (invRes.data || []).find((i) => i.id === invoiceId) || invoices.find((i) => i.id === invoiceId);

      hideLoading();

      if (res.data?.isPaid) {
        // Tampilkan Modal Perayaan Sukses Pembayaran
        triggerPaymentSuccess({
          invoiceNumber: targetInv?.invoiceNumber || 'INV-2026-001',
          amount: Number(targetInv?.amount || 1800000),
          tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
          roomNumber: targetInv?.contract?.room?.roomNumber || '101',
          propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
          paymentMethod: 'Midtrans Snap Gateway (Settlement)',
        });

        showToast('success', 'Pembayaran Terverifikasi!', 'Tagihan sewa Anda sudah tercatat LUNAS di sistem.');

        addNotification({
          category: 'payment',
          title: 'Pembayaran Sewa Kamar Berhasil Lunas',
          desc: `Pembayaran sewa ${targetInv?.contract?.room?.property?.name || 'Kos Harmoni'} kamar ${targetInv?.contract?.room?.roomNumber || '101'} senilai ${formatMoney(targetInv?.amount || 1800000)} telah lunas via Midtrans Snap.`,
          meta: {
            invoiceNumber: targetInv?.invoiceNumber,
            amount: Number(targetInv?.amount || 1800000),
            tenantName: targetInv?.contract?.tenant?.name || 'Budi Santoso',
            roomNumber: targetInv?.contract?.room?.roomNumber || '101',
            propertyName: targetInv?.contract?.room?.property?.name || 'Kos Harmoni Residence',
            actionUrl: '/invoices',
            actionLabel: 'Lihat Bukti Pembayaran',
          },
        });
      } else {
        showToast('info', 'Status: ' + (res.data?.status || 'Pending'), res.data?.message || 'Pembayaran belum diselesaikan di Midtrans.');
      }
    } catch (err: any) {
      hideLoading();
      showToast('error', 'Gagal Cek Status', err.message);
    } finally {
      setPaymentLoading(null);
    }
  };



  // Filter invoices based on active user role
  const displayedInvoices = (() => {
    if (role === 'OWNER') {
      return invoices.filter((inv) => 
        inv.contract?.room?.property?.name?.toLowerCase().includes('harmoni')
      );
    }
    if (role === 'TENANT') {
      return invoices.filter((inv) => 
        inv.contract?.tenant?.name === 'Budi Santoso' || inv.contract?.room?.roomNumber === '101'
      );
    }
    return invoices;
  })();

  // Filter kontrak untuk modal penerbitan tagihan (hanya kamar Kos Harmoni untuk Owner)
  const availableContractsForOwner = contracts.filter((c) =>
    c.room?.property?.name?.toLowerCase().includes('harmoni')
  );

  const totalInvoiced = displayedInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const paidInvoices = displayedInvoices.filter((i) => i.status === 'PAID');
  const totalPaid = paidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const unpaidInvoices = displayedInvoices.filter((i) => i.status === 'UNPAID');
  const totalUnpaid = unpaidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (role === 'ADMIN') {
    return (
      <div className="space-y-6">
        <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-[32px] p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block mb-1">
              • TRANSAKSI DIKELOLA KHUSUS
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Modul Transaksi & Pembayaran Sewa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-md mx-auto">
              Sesuai ketentuan sistem ERP, transaksi pembayaran dan penagihan sewa dikelola secara eksklusif oleh <strong>Pemilik Kos</strong> (penerbitan invoice) dan <strong>Penyewa</strong> (pelunasan via Midtrans Snap).
            </p>
          </div>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setRole('OWNER')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              Beralih ke Role Pemilik Kos
            </button>
            <button
              onClick={() => setRole('TENANT')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Beralih ke Role Penyewa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Midtrans Snap Script Loader */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                {role === 'OWNER' ? 'Role: Pemilik Kos • H. Rahmat Santoso' : 'Role: Penyewa'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {role === 'OWNER' 
                ? 'Tagihan Sewa Kos Harmoni Residence' 
                : 'Tagihan Sewa Kamar Saya'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {role === 'OWNER'
                ? 'Terbitkan tagihan sewa berkala untuk penyewa di Kos Harmoni Residence dan pantau riwayat pelunasan dana.'
                : 'Daftar invoice tagihan sewa kamar Anda yang dapat dilunasi secara online melalui Midtrans Snap.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-center">
          {/* External Currency Switcher (IDR ⇄ USD) */}
          <div className="flex items-center bg-white/90 border border-slate-200/80 rounded-2xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrency('IDR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currency === 'IDR'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              IDR (Rp)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
          </div>

          {role === 'OWNER' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" /> Terbitkan Tagihan Baru
            </button>
          )}
        </div>
      </div>

      {/* Live Exchange Rate Info Badge */}
      {currency === 'USD' && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Live Rate:</strong> 1 USD ≈ Rp {Math.round(exchangeRate?.rate || 16250).toLocaleString('id-ID')}
              <span className="text-indigo-600/70 ml-1.5 text-[11px]">(Sumber: {exchangeRate?.source || 'open.er-api.com'})</span>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-200/60">
            Realtime Conversion
          </span>
        </div>
      )}

      {/* Metric summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Invoiced */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {role === 'OWNER' ? 'TOTAL TAGIHAN KOS HARMONI' : 'TOTAL TAGIHAN SAYA'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full">
                {displayedInvoices.length} transaksi
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                {formatMoney(totalInvoiced)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {role === 'OWNER' ? 'Akumulasi tagihan unit Kos Harmoni' : 'Akumulasi transaksi sewa'}
              </p>
            </div>
            <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-full rounded-full w-full" />
            </div>
          </div>

          {/* Paid Invoices */}
          <div className="bg-white/85 backdrop-blur-xl border border-indigo-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-indigo-50/40 to-white/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                {role === 'OWNER' ? 'DANA MASUK (PAID)' : 'PEMBAYARAN TERVERIFIKASI'}
              </span>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                {paidInvoices.length} lunas
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-indigo-900 tracking-tight block">
                {formatMoney(totalPaid)}
              </span>
              <p className="text-[11px] text-indigo-600 mt-1">
                Arus kas masuk terverifikasi Midtrans
              </p>
            </div>
            <div className="mt-4 w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Unpaid for Owner/Tenant */}
          <div className="bg-white/85 backdrop-blur-xl rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between border border-rose-200/80 bg-gradient-to-br from-rose-50/40 to-white/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                {role === 'OWNER' ? 'TAGIHAN BELUM DITERIMA' : 'MENUNGGU PEMBAYARAN'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-rose-800 bg-rose-100/80">
                {unpaidInvoices.length} tertunda
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight block text-rose-800">
                {formatMoney(totalUnpaid)}
              </span>
              <p className="text-[11px] mt-1 text-rose-600">
                {role === 'OWNER' ? 'Tagihan sewa menunggu transfer penyewa' : 'Piutang sewa aktif'}
              </p>
            </div>
            <div className="mt-4 w-full h-1.5 rounded-full overflow-hidden bg-rose-100">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-rose-500" 
                style={{ width: `${totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 w-full sm:w-fit overflow-x-auto shadow-xs scrollbar-none">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#0b0f19] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          Semua Tagihan
        </button>
        <button
          onClick={() => setStatusFilter('UNPAID')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            statusFilter === 'UNPAID'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          Belum Lunas (UNPAID)
        </button>
        <button
          onClick={() => setStatusFilter('PAID')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            statusFilter === 'PAID'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          Lunas (PAID)
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Invoice data table */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              {role === 'OWNER' ? 'Daftar Tagihan Kos Harmoni' : 'Tagihan Sewa Saya'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {role === 'OWNER'
                ? 'Daftar penagihan sewa bulanan kepada penghuni kamar Kos Harmoni.'
                : 'Pilih tagihan untuk melakukan pelunasan via Midtrans Snap.'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-3 py-1 rounded-full">
            {displayedInvoices.length} Invoice
          </span>
        </div>

        {loading ? (
          <div className="py-4 px-2">
            <SkeletonTable rows={4} cols={6} />
          </div>
        ) : displayedInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            Tidak ada tagihan yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">No. Invoice</th>
                  <th className="pb-3 px-3">Penyewa & Unit</th>
                  <th className="pb-3 px-3">Jatuh Tempo</th>
                  <th className="pb-3 px-3">Nominal Tagihan</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">
                    {role === 'TENANT' ? 'Pembayaran Online' : 'Status Penagihan'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {displayedInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isPaying = paymentLoading === inv.id;
                  const tenantPhone = inv.contract?.tenant?.phone || '081234567890';
                  const tenantName = inv.contract?.tenant?.name || 'Penyewa';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-3 font-mono font-bold text-slate-900 text-xs">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-4 px-3">
                        <p className="font-bold text-slate-800 text-xs">
                          {tenantName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Kamar {inv.contract?.room?.roomNumber} • {inv.contract?.room?.property?.name}
                        </p>
                      </td>

                      <td className="py-4 px-3 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </td>

                      <td className="py-4 px-3">
                        <span className="font-black text-slate-900 text-xs block">
                          {formatMoney(inv.amount)}
                        </span>
                        {currency === 'USD' && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Rp {Number(inv.amount).toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> LUNAS (PAID)
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" /> BELUM DIBAYAR
                            </>
                          )}
                        </span>
                      </td>

                      {/* KOLOM AKSI DENGAN OTORISASI KETAT:
                          1. TENANT: Tombol "Bayar Sekarang (Midtrans)" & "Simulasi"
                          2. OWNER: Menagih & kirim pengingat WhatsApp, atau konfirmasi dana diterima. TIDAK BISA BAYAR!
                          3. ADMIN: Log audit finansial platform. TIDAK BISA BAYAR ATAU TERBITKAN! */}
                      <td className="py-4 px-3 text-right">
                        {role === 'TENANT' && (
                          <>
                            {isPaid ? (
                              <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Terbayar Lunas
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                {/* Tombol Bayar — buka tab baru Midtrans atau simulasi instan */}
                                <button
                                  disabled={isPaying}
                                  onClick={() => handlePay(inv.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  {isPaying ? <Spinner size="sm" className="text-white" /> : <CreditCard className="w-3.5 h-3.5 text-indigo-400" />}
                                  {isPaying ? 'Memproses...' : 'Bayar Sekarang'}
                                </button>
                                {/* Tombol Cek Status — refresh & sinkronkan status langsung dari Midtrans */}
                                <button
                                  disabled={isPaying}
                                  onClick={() => handleCheckStatus(inv.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                  title="Cek Status Pembayaran ke Midtrans"
                                >
                                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Cek Status
                                </button>
                              </div>
                            )}
                          </>
                        )}


                        {role === 'OWNER' && (
                          <>
                            {isPaid ? (
                              <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dana Diterima
                              </span>
                            ) : (
                              <a
                                href={`https://wa.me/${tenantPhone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(tenantName)},%20mengingatkan%20tagihan%20sewa%20${inv.invoiceNumber}%20sebesar%20Rp%20${Number(inv.amount).toLocaleString('id-ID')}%20telah%20terbit.%20Mohon%20melakukan%20pembayaran.`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Kirim pesan penagihan langsung ke WhatsApp penyewa"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Ingatkan WA
                              </a>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Terbitkan Tagihan Baru (HANYA UNTUK PEMILIK KOS - Responsif Mobile Bottom Sheet) */}
      {showCreateModal && role === 'OWNER' && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-[32px] sm:rounded-[32px] max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  PENAGIHAN SEWA KOS HARMONI
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Terbitkan Tagihan Sewa Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terbitkan tagihan sewa berkala untuk penyewa di Kos Harmoni Residence.
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Pilih Kontrak Penyewa di Kos Harmoni
                </label>
                {availableContractsForOwner.length === 0 ? (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
                    Tidak ada kontrak aktif di Kos Harmoni saat ini.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Pilih Kontrak Sewa Kos Harmoni --</option>
                    {availableContractsForOwner.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tenant?.name} (Kamar {c.room?.roomNumber} - {c.room?.property?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nominal Tagihan (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-black text-slate-400">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 1.800.000"
                    value={amount}
                    onChange={(e) => setAmount(formatNumberWithDots(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableContractsForOwner.length === 0}
                  className="px-5 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-950/20 cursor-pointer inline-flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" className="text-white" />}
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
