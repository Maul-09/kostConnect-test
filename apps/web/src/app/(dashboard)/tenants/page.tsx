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
      {/* 1. Frosted Hero Header */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                MODUL 2
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-100/90 text-indigo-900 border border-indigo-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                CRM Module
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Penyewa & Kontrak Sewa
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Pencatatan data tenant, penerbitan kontrak sewa berjangka, dan otomasi alur status kamar (check-in $\rightarrow$ OCCUPIED, check-out $\rightarrow$ AVAILABLE).
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

      {/* 2. Glass Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Penyewa</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{tenants.length}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Akun terdaftar</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-indigo-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-indigo-50/40 to-white/80">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Kontrak Berjalan</span>
          <span className="text-3xl font-black text-indigo-800 mt-1 block">{activeContracts.length}</span>
          <span className="text-[11px] text-indigo-600 mt-1 block">Aktif saat ini</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Riwayat Kontrak</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{contracts.length}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Histori operasional</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-blue-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-blue-50/40 to-white/80">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Kamar Kosong</span>
          <span className="text-3xl font-black text-blue-800 mt-1 block">{availableRooms.length}</span>
          <span className="text-[11px] text-blue-600 mt-1 block">Siap diisi kontrak baru</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Contracts List Section */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-5">
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
        <div className="flex items-center justify-between mb-5">
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

      {/* Modal Daftarkan Penyewa */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Daftarkan Penyewa Baru</h3>
              <button 
                onClick={() => setShowTenantModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@gmail.com"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Simpan Penyewa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Kontrak Baru */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Terbitkan Kontrak Sewa</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Otomatis mengubah kamar menjadi OCCUPIED</p>
              </div>
              <button 
                onClick={() => setShowContractModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Penyewa</label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
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
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Unit Kamar (Hanya Kamar AVAILABLE)
                </label>
                {availableRooms.length === 0 ? (
                  <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    Tidak ada unit kamar kosong saat ini.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mulai Sewa</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selesai Sewa</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={availableRooms.length === 0}
                  className="px-4 py-2 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
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
