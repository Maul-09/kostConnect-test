'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Property, Room, ApiResponse } from '@/types';
import { useRole } from '@/context/RoleContext';
import { 
  Building2, 
  Plus, 
  DoorOpen, 
  CheckCircle2, 
  Clock, 
  X, 
  MapPin,
  ShieldCheck,
  UserCheck,
  Lock
} from 'lucide-react';
import { Skeleton, SkeletonCard, Spinner } from '@/components/ui/skeleton';

export default function PropertiesPage() {
  const { role } = useRole();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [togglingRoomId, setTogglingRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyOwner, setPropertyOwner] = useState('H. Rahmat Santoso');

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
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    try {
      setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRoomStatus = async (roomId: string) => {
    try {
      setTogglingRoomId(roomId);
      await api.patch(`/properties/rooms/${roomId}/toggle-status`);
      fetchProperties();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingRoomId(null);
    }
  };

  // Helper untuk identifikasi pemilik properti
  const getPropertyOwner = (p: Property) => {
    if (p.name.toLowerCase().includes('harmoni')) {
      return { name: 'H. Rahmat Santoso', isCurrentOwner: true, locationTag: 'Jakarta Selatan' };
    }
    if (p.name.toLowerCase().includes('griya')) {
      return { name: 'Ibu Hj. Fatimah', isCurrentOwner: false, locationTag: 'Bandung' };
    }
    return { name: 'Mitra Terdaftar', isCurrentOwner: false, locationTag: p.city };
  };

  // Filter properties based on active user role
  const displayedProperties = role === 'OWNER'
    ? properties.filter((p) => p.name.toLowerCase().includes('harmoni'))
    : properties;

  // Summary counts for current role scope
  const totalProperties = displayedProperties.length;
  const allRooms: Room[] = displayedProperties.flatMap((p) => p.rooms || []);
  const totalRooms = allRooms.length;
  const occupiedRooms = allRooms.filter((r) => r.status === 'OCCUPIED').length;
  const availableRooms = allRooms.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-slate-50/80 to-blue-50/80 backdrop-blur-xl border border-indigo-200/70 rounded-[28px] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0b0f19] to-indigo-950 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/20 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                {role === 'ADMIN' ? 'Role: Super Admin • Platform' : role === 'OWNER' ? 'Role: Pemilik Kos • H. Rahmat Santoso' : 'Role: Penyewa'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {role === 'ADMIN' 
                ? 'Pendaftaran & Manajemen Properti Mitra' 
                : role === 'OWNER' 
                ? 'Unit Kamar Kos Harmoni Residence' 
                : 'Informasi Properti & Kamar'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {role === 'ADMIN'
                ? 'Daftarkan properti kos baru ke platform dan pantau seluruh aset milik mitra kos. (Unit kamar dikelola mandiri oleh masing-masing pemilik kos).'
                : role === 'OWNER'
                ? 'Kelola ketersediaan unit kamar, harga sewa per bulan, dan status hunian kamar di Kos Harmoni Residence.'
                : 'Daftar informasi fasilitas kamar dan kondisi hunian kos yang sedang Anda sewa.'}
            </p>
          </div>
        </div>

        {/* HANYA Super Admin yang memiliki hak mendaftarkan Properti Baru ke Platform! */}
        {role === 'ADMIN' && (
          <button
            onClick={() => setShowPropertyModal(true)}
            className="bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md shadow-indigo-950/20 hover:shadow-lg transition-all flex items-center gap-2 shrink-0 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-400" /> Daftarkan Properti Baru
          </button>
        )}

        {/* Pemilik Kos memiliki info badge hak kepemilikan */}
        {role === 'OWNER' && (
          <div className="bg-white/90 border border-indigo-200/80 rounded-2xl px-4 py-2.5 shadow-2xs self-start sm:self-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kepemilikan Sah</span>
            <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kos Harmoni Residence
            </span>
          </div>
        )}
      </div>

      {/* 2. Glass Metric Cards (Tersinkronisasi Presisi dengan Hak Akses) */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {role === 'ADMIN' ? 'Properti Terdaftar' : 'Properti Anda'}
            </span>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight block">{totalProperties}</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">
                {role === 'ADMIN' ? 'Seluruh mitra platform' : 'Kos Harmoni Residence'}
              </span>
            </div>
            <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Unit Kamar</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight block">{totalRooms}</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">
                {role === 'OWNER' ? 'Kapasitas Kos Harmoni' : 'Kapasitas hunian'}
              </span>
            </div>
            <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-xl border border-blue-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-blue-50/40 to-white/80 hover:shadow-md transition-all flex flex-col justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Kamar Kosong</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-blue-800 tracking-tight block">{availableRooms}</span>
              <span className="text-xs font-bold text-blue-700 mt-1 block">AVAILABLE (Siap disewa)</span>
            </div>
            <div className="mt-4 w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }} 
              />
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-xl border border-amber-200/80 rounded-[24px] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] bg-gradient-to-br from-amber-50/40 to-white/80 hover:shadow-md transition-all flex flex-col justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Kamar Terisi</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-amber-800 tracking-tight block">{occupiedRooms}</span>
              <span className="text-xs font-bold text-amber-700 mt-1 block">OCCUPIED (Dalam kontrak)</span>
            </div>
            <div className="mt-4 w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50/80 backdrop-blur-md border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 3. Daftar Properti dengan Isolasi Kepemilikan & Hak Kelola Kamar */}
      {loading ? (
        <div className="space-y-6">
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          </div>
          <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-lg" />
                <Skeleton className="h-3.5 w-32 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          </div>
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] p-16 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada properti yang tersedia</h3>
          <p className="text-xs text-slate-400 mt-1">Anda tidak memiliki akses ke properti ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedProperties.map((property) => {
            const ownerInfo = getPropertyOwner(property);
            const isOwner = role === 'OWNER';
            const isAdmin = role === 'ADMIN';

            return (
              <div 
                key={property.id} 
                className="bg-white/85 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] overflow-hidden transition-all"
              >
                {/* Header Properti */}
                <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-slate-900 leading-tight">
                          {property.name}
                        </h3>
                        {/* Label Pemilik untuk Super Admin */}
                        {isAdmin && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-purple-600" /> Pemilik: {ownerInfo.name}
                          </span>
                        )}
                        {/* Label Kepemilikan Sah untuk Owner */}
                        {isOwner && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Properti Milik Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {property.address}, {property.city}
                      </p>
                    </div>
                  </div>

                  {/* AKSI PROPERTI BERDASARKAN OTORISASI:
                      - Pemilik Kos: BISA Tambah Kamar di propertinya.
                      - Super Admin: TIDAK BISA menambah kamar harian (karena ini tugas operasional pemilik kos). */}
                  {isOwner && (
                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setShowRoomModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b0f19] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-400" /> Tambah Kamar
                    </button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5" title="Kamar dan tarif dikelola secara independen oleh pemilik kos yang bersangkutan">
                        <Lock className="w-3.5 h-3.5 text-slate-400" /> Unit Dikelola Pemilik Kos
                      </span>
                    </div>
                  )}
                </div>

                {/* Daftar Kamar di Properti */}
                <div className="p-5 md:p-6">
                  {!property.rooms || property.rooms.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                      Belum ada unit kamar di properti ini.
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

                            {/* FOOTER KAMAR:
                                - Pemilik Kos: BISA Toggle status untuk renovasi/perawatan.
                                - Super Admin: View-only (tidak mengubah ketersediaan kamar pemilik). */}
                            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {isOccupied ? 'Sedang Disewa' : 'Siap Dihuni'}
                              </span>

                              {isOwner ? (
                                <button
                                  disabled={togglingRoomId === room.id}
                                  onClick={() => handleToggleRoomStatus(room.id)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-900 disabled:opacity-50 underline transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Ganti status secara manual untuk keperluan perawatan/renovasi kamar"
                                >
                                  {togglingRoomId === room.id && <Spinner size="sm" className="text-indigo-600" />}
                                  {togglingRoomId === room.id ? 'Mengubah...' : 'Toggle Status'}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  {isAdmin ? 'Otoritas Pemilik' : 'Read-only'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Daftarkan Properti Baru (HANYA UNTUK SUPER ADMIN - Responsif Mobile Bottom Sheet) */}
      {showPropertyModal && role === 'ADMIN' && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPropertyModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-[32px] sm:rounded-[32px] max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  PENDAFTARAN PROPERTI MITRA
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Daftarkan Properti Kos Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sebagai Super Admin, daftarkan lokasi kos dan tentukan mitra pemilik kosnya.
                </p>
              </div>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Properti Kos</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Griya Melati Asri"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Mitra Pemilik Kos</label>
                <input
                  type="text"
                  required
                  placeholder="Nama mitra pemilik kos"
                  value={propertyOwner}
                  onChange={(e) => setPropertyOwner(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Alamat Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Sukabumi No. 12"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Kota</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bandung"
                  value={propertyCity}
                  onChange={(e) => setPropertyCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPropertyModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-950/20 cursor-pointer inline-flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" className="text-white" />}
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan Properti'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kamar (HANYA UNTUK PEMILIK KOS - Responsif Mobile Bottom Sheet) */}
      {showRoomModal && role === 'OWNER' && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoomModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-t-[32px] sm:rounded-[32px] max-w-lg w-full p-5 sm:p-8 shadow-2xl space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                  UNIT KAMAR KOS HARMONI
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Tambah Unit Kamar Baru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftarkan kamar baru di Kos Harmoni Residence beserta tarif sewa bulanan.
                </p>
              </div>
              <button 
                onClick={() => setShowRoomModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nomor / Kode Kamar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 104 atau B-02"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Harga Sewa Bulanan (IDR)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1800000"
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-950/20 cursor-pointer inline-flex items-center gap-2"
                >
                  {submitting && <Spinner size="sm" className="text-white" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Kamar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
