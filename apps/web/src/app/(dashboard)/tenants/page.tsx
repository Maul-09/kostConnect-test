'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Tenant, Contract, Room, ApiResponse } from '@/types';
import { Users, Plus, FileText, CheckCircle2, XCircle, Calendar, Phone, Mail } from 'lucide-react';

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
    // Default dates: today and 6 months from now
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
    if (!confirm('Apakah Anda yakin ingin menyelesaikan kontrak sewa ini (Check-out)? Status kamar akan kembali menjadi AVAILABLE.')) {
      return;
    }
    try {
      await api.patch(`/tenants/contracts/${contractId}/terminate`);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeContractsCount = contracts.filter((c) => c.isActive).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Modul 2: Penyewa & Kontrak Sewa (CRM)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data penyewa, pendaftaran kontrak aktif (otomatis ubah kamar jadi OCCUPIED), dan alur check-out (kembalikan jadi AVAILABLE).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTenantModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Penyewa
          </button>
          <button
            onClick={() => setShowContractModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Kontrak Baru
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Penyewa</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{tenants.length}</span>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Kontrak Aktif</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{activeContractsCount}</span>
        </div>
        <div className="bg-white border border-blue-200 bg-blue-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider block">Kamar Siap Disewa</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{availableRooms.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-800">Daftar Kontrak Sewa</h3>
          </div>
          <span className="text-xs text-slate-400">{contracts.length} kontrak tercatat</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat data kontrak...</div>
        ) : contracts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada kontrak sewa aktif.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Penyewa (Tenant)</th>
                  <th className="py-3 px-4">Kamar & Properti</th>
                  <th className="py-3 px-4">Periode Sewa</th>
                  <th className="py-3 px-4">Status Kontrak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>{c.tenant?.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{c.tenant?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">Kamar {c.room?.roomNumber}</span>
                      <span className="text-slate-400 block text-[11px]">{c.room?.property?.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(c.startDate).toLocaleDateString('id-ID')} &ndash; {new Date(c.endDate).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Aktif (Occupied)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          <XCircle className="w-3 h-3" /> Berakhir
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.isActive && (
                        <button
                          onClick={() => handleTerminateContract(c.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          Check-out (Kosongkan Kamar)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenants Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-base text-slate-800">Master Data Penyewa (Tenant)</h3>
        </div>

        {tenants.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada tenant terdaftar.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tenants.map((t) => (
              <div key={t.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                <span className="font-bold text-sm text-slate-800 block">{t.name}</span>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Penyewa */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Daftarkan Penyewa Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Identitas lengkap penyewa kos.</p>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Ajiz"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: ajiz@example.com"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Simpan Penyewa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Kontrak */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Buat Kontrak Sewa Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih penyewa dan kamar yang tersedia. Kamar akan otomatis berubah menjadi <span className="font-semibold text-amber-600">OCCUPIED</span>.
            </p>

            <form onSubmit={handleCreateContract} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Penyewa</label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Pilih Penyewa --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pilih Kamar (Hanya Kamar AVAILABLE)</label>
                {availableRooms.length === 0 ? (
                  <p className="text-xs text-rose-500 italic">Tidak ada kamar berstatus AVAILABLE saat ini.</p>
                ) : (
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Kamar Tersedia --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kamar {r.roomNumber} - {r.property?.name} (Rp {Number(r.monthlyPrice).toLocaleString('id-ID')}/bln)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mulai Sewa</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Berakhir Sewa</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={availableRooms.length === 0}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
                >
                  Aktifkan Kontrak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
