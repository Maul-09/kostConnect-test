'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Tenant, Contract, Room, ApiResponse } from '@/types';
import { 
  Users, 
  Plus, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Phone, 
  Mail, 
  DoorOpen, 
  X,
  LogOut,
  Building2,
  Sparkles
} from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');

  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, contractsRes, roomsRes] = await Promise.all([
        api.get<any, ApiResponse<Tenant[]>>('/tenants'),
        api.get<any, ApiResponse<Contract[]>>('/tenants/contracts/all'),
        api.get<any, ApiResponse<Room[]>>('/properties/rooms/all?status=AVAILABLE'),
      ]);
      setTenants(tenantsRes.data);
      setContracts(contractsRes.data);
      setAvailableRooms(roomsRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data penyewa & kontrak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    setStartDate(today);
    setEndDate(sixMonthsLater.toISOString().split('T')[0]);
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', {
        name: tenantName,
        email: tenantEmail,
        phone: tenantPhone,
      });
      setShowTenantModal(false);
      setTenantName('');
      setTenantEmail('');
      setTenantPhone('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !selectedRoomId) {
      alert('Pilih penyewa dan kamar terlebih dahulu.');
      return;
    }
    try {
      await api.post('/tenants/contracts', {
        tenantId: selectedTenantId,
        roomId: selectedRoomId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setShowContractModal(false);
      setSelectedTenantId('');
      setSelectedRoomId('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTerminateContract = async (contractId: string) => {
    if (!confirm('Apakah Anda yakin ingin menyelesaikan kontrak sewa ini (Check-out)? Status kamar akan otomatis kembali menjadi AVAILABLE.')) {
      return;
    }
    try {
      await api.patch(`/tenants/contracts/${contractId}/terminate`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeContracts = contracts.filter((c) => c.isActive);

  return (
    <div className="space-y-6">
      {/* 1. Frosted Hero Header (Selaras 100% dengan Dashboard & Properti) */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                Data Penyewa & Kontrak
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Penyewa & Kontrak Sewa
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Pencatatan data identitas penyewa, penerbitan kontrak sewa kamar, dan proses check-out.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center flex-wrap">
          <button
            onClick={() => setShowTenantModal(true)}
            className="bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-600" /> Daftarkan Penyewa
          </button>
          <button
            onClick={() => setShowContractModal(true)}
            className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-indigo-400" /> Buat Kontrak Baru
          </button>
        </div>
      </div>

      {/* 2. Glass Metric Cards (Selaras 100% dengan Dashboard & Properti) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Penyewa</span>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight block">{tenants.length}</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">Akun terdaftar</span>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl border border-indigo-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-indigo-50/40 to-white/80 hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Kontrak Berjalan</span>
          <div className="mt-2">
            <span className="text-3xl font-black text-indigo-800 tracking-tight block">{activeContracts.length}</span>
            <span className="text-xs font-bold text-indigo-700 mt-1 block">Aktif saat ini</span>
          </div>
          <div className="mt-4 w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${contracts.length > 0 ? (activeContracts.length / contracts.length) * 100 : 0}%` }} 
            />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Riwayat Kontrak</span>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight block">{contracts.length}</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">Histori transaksi</span>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-xl border border-blue-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-blue-50/40 to-white/80 hover:shadow-md transition-all flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Kamar Kosong</span>
          <div className="mt-2">
            <span className="text-3xl font-black text-blue-800 tracking-tight block">{availableRooms.length}</span>
            <span className="text-xs font-bold text-blue-700 mt-1 block">Siap diisi kontrak baru</span>
          </div>
          <div className="mt-4 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Contracts List Section */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Daftar Kontrak Sewa Unit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kontrak sewa mengikat antara penyewa dan unit kamar kos.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
            {activeContracts.length} Aktif
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold">Memuat data kontrak...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            Belum ada kontrak sewa. Klik &quot;Buat Kontrak Baru&quot; untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Penyewa</th>
                  <th className="pb-3 px-3">Properti & Kamar</th>
                  <th className="pb-3 px-3">Durasi Sewa</th>
                  <th className="pb-3 px-3">Status Kontrak</th>
                  <th className="pb-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-800 text-xs">
                        {contract.tenant?.name || 'Penyewa'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {contract.tenant?.phone || '-'}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                        Kamar {contract.room?.roomNumber || '-'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {contract.room?.property?.name || 'Properti'}
                      </p>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(contract.startDate).toLocaleDateString('id-ID')} s/d{' '}
                          {new Date(contract.endDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          contract.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {contract.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> AKTIF
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> SELESAI
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {contract.isActive ? (
                        <button
                          onClick={() => handleTerminateContract(contract.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                          title="Selesaikan kontrak sewa dan kembalikan status kamar menjadi AVAILABLE"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Check-out
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Telah Berakhir</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Tenants Directory Section */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Direktori Identitas Penyewa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data kontak dan identitas penyewa yang terdaftar di dalam sistem.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100/70 border border-slate-200/60 px-3 py-1 rounded-full">
            {tenants.length} Penyewa
          </span>
        </div>

        {tenants.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada penyewa terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50/70 hover:bg-white border border-slate-200/60 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                    {t.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">ID: {t.id.substring(0, 8)}...</p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{t.email || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Daftarkan Penyewa (Selaras 100% dengan Notifikasi Popup) */}
      {showTenantModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTenantModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  DATA PENYEWA
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Daftarkan Penyewa Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input identitas penyewa untuk keperluan kontrak dan penerbitan invoice.
                </p>
              </div>
              <button 
                onClick={() => setShowTenantModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-950/20"
                >
                  Simpan Penyewa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Kontrak Baru (Selaras 100% dengan Notifikasi Popup) */}
      {showContractModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowContractModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  KONTRAK SEWA
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Terbitkan Kontrak Sewa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status kamar otomatis beralih menjadi OCCUPIED.
                </p>
              </div>
              <button 
                onClick={() => setShowContractModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Penyewa</label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="">-- Pilih Penyewa Terdaftar --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Pilih Unit Kamar (Hanya Kamar AVAILABLE)
                </label>
                {availableRooms.length === 0 ? (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">
                    Tidak ada unit kamar kosong saat ini.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- Pilih Kamar Kosong --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kamar {r.roomNumber} - {r.property?.name || 'Kos'} (Rp {Number(r.monthlyPrice).toLocaleString('id-ID')}/bln)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Mulai Sewa</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Selesai Sewa</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={availableRooms.length === 0}
                  className="px-5 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-950/20"
                >
                  Terbitkan Kontrak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
