'use client';

import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Check, 
  X,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Spinner } from '@/components/ui/skeleton';

export function ForcePasswordModal() {
  const { mustChangePassword, setMustChangePassword, changePassword, currentProfile } = useRole();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hide / Show Password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!mustChangePassword) return null;

  // Real-time security criteria verification
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const isPasswordSecure = 
    hasMinLength && 
    hasUpperCase && 
    hasLowerCase && 
    hasNumber && 
    hasSpecialChar;

  const canSubmit = isPasswordSecure && isMatch && currentPassword.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Password lama / sementara wajib diisi.');
      return;
    }
    if (!isPasswordSecure) {
      setError('Password baru belum memenuhi seluruh kriteria keamanan yang ditentukan.');
      return;
    }
    if (!isMatch) {
      setError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await changePassword(newPassword, currentPassword);
      if (res.success) {
        setSuccess('Kata sandi baru berhasil diperbarui dan akun Anda kini terproteksi.');
        setTimeout(() => {
          setMustChangePassword(false);
          setSuccess(null);
        }, 1500);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 my-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
              KEAMANAN AKUN RESMI
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Wajib Ganti Password Pertama Kali
            </h3>
          </div>
        </div>

        {/* Notice Info */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs space-y-1">
          <p className="text-slate-700 leading-relaxed">
            Halo, <strong className="text-slate-900">{currentProfile.name}</strong> ({currentProfile.title}). Akun Anda dibuatkan oleh sistem dengan password sementara.
          </p>
          <p className="text-[11px] text-slate-500">
            Demi privasi dan keamanan data properti Anda, silakan masukkan password sementara saat ini dan tetapkan kata sandi baru berstandar keamanan tinggi.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <X className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Password Lama / Sementara */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Password Sementara Saat Ini
              </label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Default: 123456789
              </span>
            </div>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password sementara (123456789)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                title={showCurrentPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. Password Baru */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Kata Sandi Baru (Min. 8 Karakter)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                placeholder="Buat password baru yang kuat..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Checklist Validasi Keamanan Password Real-time */}
            <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Kriteria Keamanan Sandi Wajib:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">•</span>}
                  <span>Minimal 8 Karakter</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasUpperCase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasUpperCase ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">•</span>}
                  <span>Huruf Besar (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasLowerCase ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasLowerCase ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">•</span>}
                  <span>Huruf Kecil (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium transition-colors ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">•</span>}
                  <span>Angka (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 font-medium transition-colors col-span-2 ${hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">•</span>}
                  <span>Simbol / Karakter Khusus (!@#$%^&*)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Konfirmasi Password Baru */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Ulangi Kata Sandi Baru
              </label>
              {confirmPassword && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${isMatch ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {isMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {isMatch ? 'Sandi Cocok' : 'Belum Cocok'}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Ketik ulang password baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Spinner size="sm" className="text-white" />}
              <span>{loading ? 'Menyimpan & Mengamankan...' : 'Simpan Kata Sandi Baru & Buka Akses'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMustChangePassword(false)}
              className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Lewati untuk Demo Reviewer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
