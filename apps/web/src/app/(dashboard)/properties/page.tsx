'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Property, Room, ApiResponse } from '@/types';
import { Building2, Plus, DoorOpen, CheckCircle2, Clock } from 'lucide-react';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomPrice, setRoomPrice] = useState('1800000');

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get<any, ApiResponse<Property[]>>('/properties');
      setProperties(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar properti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/properties', {
        name: propertyName,
        address: propertyAddress,
        city: propertyCity,
      });
      setShowPropertyModal(false);
      setPropertyName('');
      setPropertyAddress('');
      setPropertyCity('');
      fetchProperties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    try {
      await api.post(`/properties/${selectedPropertyId}/rooms`, {
        roomNumber,
        monthlyPrice: Number(roomPrice),
      });
      setShowRoomModal(false);
      setRoomNumber('');
      setRoomPrice('1800000');
      fetchProperties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleRoomStatus = async (roomId: string) => {
    try {
      await api.patch(`/properties/rooms/${roomId}/toggle-status`);
      fetchProperties();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Metrics
  const totalProperties = properties.length;
  const allRooms: Room[] = properties.flatMap((p) => p.rooms || []);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableRooms = allRooms.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Modul 1: Properti & Kamar (Aset)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data properti, nomor kamar, harga sewa bulanan, dan indikator status kamar real-time.
          </p>
        </div>
        <button
          onClick={() => setShowPropertyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Properti Baru
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Properti</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{totalProperties}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Kamar</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{totalRooms}</span>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Tersedia (Available)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{availableRooms}</span>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-4">
          <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider block">Terisi (Occupied)</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{occupiedRooms}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Property List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data properti...</div>
      ) : properties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Belum ada properti terdaftar</p>
          <p className="text-xs text-slate-400 mt-1">Klik tombol &quot;Tambah Properti Baru&quot; untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-base text-slate-800">{property.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{property.address}, {property.city}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setShowRoomModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium self-start sm:self-center transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kamar
                </button>
              </div>

              {/* Rooms in property */}
              <div className="p-5">
                {!property.rooms || property.rooms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada unit kamar di properti ini.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {property.rooms.map((room) => {
                      const isOccupied = room.status === 'OCCUPIED';
                      return (
                        <div
                          key={room.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            isOccupied
                              ? 'bg-slate-50/70 border-slate-200'
                              : 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800 flex items-center gap-1">
                                <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                                Kamar {room.roomNumber}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  isOccupied
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isOccupied ? (
                                  <>
                                    <Clock className="w-2.5 h-2.5" /> OCCUPIED
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-2.5 h-2.5" /> AVAILABLE
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 mt-2">
                              Rp {Number(room.monthlyPrice).toLocaleString('id-ID')} / bln
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-150 flex items-center justify-between">
                            <button
                              onClick={() => handleToggleRoomStatus(room.id)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Toggle Status
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Properti */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Properti Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Masukkan data master properti / gedung kos.</p>

            <form onSubmit={handleCreateProperty} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Properti</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kos Harmoni Kemang"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Kemang Raya No. 45"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kota</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jakarta Selatan"
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Simpan Properti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kamar */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Unit Kamar</h3>
            <p className="text-xs text-slate-500 mb-4">Tambahkan nomor unit kamar dan harga sewa bulanan.</p>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Kamar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 104 atau A3"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Harga Sewa Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50000"
                  placeholder="Contoh: 1800000"
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Simpan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
