'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Property, Room, ApiResponse } from '@/types';
import { 
  Building2, 
  Plus, 
  DoorOpen, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles, 
  Layers,
  MapPin
} from 'lucide-react';

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
    <div className="space-y-6">
      {/* 1. Frosted Hero Header */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950">
                MODUL 1
              </span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-100/90 text-indigo-900 border border-indigo-300/60 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                Asset Module
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Properti & Kamar
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Kelola inventaris kos, kapasitas kamar, tarif sewa bulanan, dan pantau status ketersediaan secara real-time.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPropertyModal(true)}
          className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4 text-indigo-400" /> Tambah Properti Baru
        </button>
      </div>

      {/* 2. Glass Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Properti</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{totalProperties}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Lokasi operasional</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Unit Kamar</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{totalRooms}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">Kapasitas hunian</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-blue-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-blue-50/40 to-white/80">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Kamar Kosong (Available)</span>
          <span className="text-3xl font-black text-blue-800 mt-1 block">{availableRooms}</span>
          <span className="text-[11px] text-blue-600 mt-1 block">Siap disewa</span>
        </div>
        <div className="bg-white/85 backdrop-blur-xl border border-amber-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-amber-50/40 to-white/80">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Terisi (Occupied)</span>
          <span className="text-3xl font-black text-amber-800 mt-1 block">{occupiedRooms}</span>
          <span className="text-[11px] text-amber-600 mt-1 block">Dalam kontrak</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Property List Container */}
      {loading ? (
        <div className="p-16 text-center text-xs font-bold text-slate-400 bg-white/50 backdrop-blur-md rounded-[28px] border border-white/60">
          Memuat data properti...
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-16 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Belum ada properti terdaftar</h3>
          <p className="text-xs text-slate-400 mt-1">Klik tombol &quot;Tambah Properti Baru&quot; untuk menambahkan kos pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] overflow-hidden transition-all"
            >
              {/* Header properti */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 leading-tight">
                      {property.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {property.address}, {property.city}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setShowRoomModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-center"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" /> Tambah Kamar
                </button>
              </div>

              {/* Rooms in property */}
              <div className="p-5 md:p-6">
                {!property.rooms || property.rooms.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                    Belum ada unit kamar di properti ini. Klik tombol &quot;Tambah Kamar&quot; di atas.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {property.rooms.map((room) => {
                      const isOccupied = room.status === 'OCCUPIED';
                      return (
                        <div
                          key={room.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            isOccupied
                              ? 'bg-slate-50/80 border-slate-200/80'
                              : 'bg-blue-50/30 border-blue-200/70 hover:border-blue-300/90 shadow-2xs'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                <DoorOpen className="w-4 h-4 text-slate-400" />
                                Kamar {room.roomNumber}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                  isOccupied
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isOccupied ? (
                                  <>
                                    <Clock className="w-3 h-3" /> OCCUPIED
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> AVAILABLE
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500">Harga Sewa:</p>
                            <p className="text-sm font-black text-slate-900">
                              Rp {Number(room.monthlyPrice).toLocaleString('id-ID')}
                              <span className="text-[10px] text-slate-400 font-normal"> /bln</span>
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isOccupied ? 'Sedang Disewa' : 'Siap Dihuni'}
                            </span>
                            <button
                              onClick={() => handleToggleRoomStatus(room.id)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-900 underline transition-colors"
                              title="Ganti status secara manual untuk keperluan perawatan/renovasi"
                            >
                              Toggle
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Properti Kos Baru</h3>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Properti Kos</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kos Harmoni Residence"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Sukabumi No. 12"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kota</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bandung"
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Unit Kamar Baru</h3>
              <button 
                onClick={() => setShowRoomModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor / Kode Kamar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 104 atau B-02"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Harga Sewa Bulanan (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1800000"
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
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
