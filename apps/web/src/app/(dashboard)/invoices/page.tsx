'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { api } from '@/lib/api';
import { Invoice, Contract, ApiResponse } from '@/types';
import { Receipt, Plus, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    snap?: any;
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientKey, setClientKey] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Modal create invoice
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [amount, setAmount] = useState('1800000');
  const [dueDate, setDueDate] = useState('');

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
    }
  };

  useEffect(() => {
    fetchClientKey();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setDueDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId) {
      alert('Pilih kontrak sewa terlebih dahulu.');
      return;
    }
    try {
      await api.post('/invoices', {
        contractId: selectedContractId,
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString(),
      });
      setShowCreateModal(false);
      setSelectedContractId('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Payment Handler via Midtrans Snap
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
            alert('Pembayaran Berhasil Diverifikasi!');
            loadData();
          },
          onPending: () => {
            alert('Menunggu penyelesaian pembayaran.');
            loadData();
          },
          onError: (err: any) => {
            alert('Pembayaran gagal atau dibatalkan: ' + JSON.stringify(err));
          },
          onClose: () => {
            loadData();
          },
        });
      } else {
        // Jika token simulasi atau popup snap belum ready, sediakan opsi redirect/simulasi langsung
        if (confirm('Token pembayaran berhasil dibuat. Ingin membuka simulasi pembayaran instan (Demo Reviewer)?')) {
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

  // Fast demo reviewer endpoint: simulates Midtrans settlement webhook
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

  const totalInvoiced = invoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalPaid = paidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const unpaidInvoices = invoices.filter((i) => i.status === 'UNPAID');
  const totalUnpaid = unpaidInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Midtrans Snap Script Loader */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Modul 3: Tagihan & Pembayaran (Keuangan)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan invoice sewa, integrasi Midtrans Snap Sandbox, dan otomasi status pelunasan via webhook.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Terbitkan Tagihan Baru
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Tagihan Terbit</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">
            Rp {totalInvoiced.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{invoices.length} transaksi</span>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Pembayaran Diterima (PAID)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            Rp {totalPaid.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">{paidInvoices.length} invoice lunas</span>
        </div>
        <div className="bg-white border border-rose-200 bg-rose-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block">Belum Lunas (UNPAID)</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            Rp {totalUnpaid.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-rose-600 mt-0.5 block">{unpaidInvoices.length} invoice tertunda</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'UNPAID', 'PAID'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status === 'ALL' ? 'Semua Tagihan' : status === 'UNPAID' ? 'Belum Lunas (UNPAID)' : 'Lunas (PAID)'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-800">Daftar Tagihan Sewa</h3>
          </div>
          <span className="text-xs text-slate-400">{invoices.length} invoice</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat invoice...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Tidak ada tagihan yang sesuai filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Penyewa & Kamar</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Nominal Tagihan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isUnpaid = inv.status === 'UNPAID';
                  const isCancelled = inv.status === 'CANCELLED';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{inv.contract?.tenant?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Kamar {inv.contract?.room?.roomNumber} - {inv.contract?.room?.property?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        Rp {Number(inv.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> LUNAS (PAID)
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3 h-3" /> BELUM DIBAYAR
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            <XCircle className="w-3 h-3" /> BATAL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isUnpaid ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePay(inv.id)}
                              disabled={paymentLoading === inv.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {paymentLoading === inv.id ? 'Memproses...' : 'Bayar Sekarang'}
                            </button>
                            <button
                              onClick={() => handleSimulatePayment(inv.id)}
                              title="Simulasi pelunasan instan (Khusus Demo Reviewer)"
                              disabled={paymentLoading === inv.id}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isPaid ? (
                          <span className="text-[11px] text-slate-400">
                            {inv.paidAt ? `Dibayar: ${new Date(inv.paidAt).toLocaleDateString('id-ID')}` : 'Lunas'}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Terbitkan Tagihan Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Terbitkan Tagihan Sewa Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Pilih kontrak sewa aktif yang ingin ditagihkan.</p>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kontrak Sewa</label>
                {contracts.length === 0 ? (
                  <p className="text-xs text-rose-500 italic">Tidak ada kontrak aktif saat ini.</p>
                ) : (
                  <select
                    required
                    value={selectedContractId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setSelectedContractId(cId);
                      const found = contracts.find((c) => c.id === cId);
                      if (found?.room?.monthlyPrice) {
                        setAmount(String(found.room.monthlyPrice));
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Kontrak --</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.tenant?.name} &ndash; Kamar {c.room?.roomNumber} ({c.room?.property?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={contracts.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
