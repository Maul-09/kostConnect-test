'use client';

import React, { useState } from 'react';
import { useRole } from '@/context/RoleContext';
import { ShieldAlert, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import { Spinner } from '@/components/ui/skeleton';

export function ForcePasswordModal() {
  const { mustChangePassword, setMustChangePassword, changePassword, currentProfile } = useRole();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await changePassword(newPassword);
      if (res.success) {
        alert(res.message);
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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
              KEAMANAN AKUN RESMI
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Wajib Perbarui Kata Sandi
            </h3>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs space-y-1">
          <p className="text-slate-700 leading-relaxed">
            Halo, <strong className="text-slate-900">{currentProfile.name}</strong> ({currentProfile.title}). Akun Anda dibuatkan oleh administrator dengan kata sandi sementara.
          </p>
          <p className="text-[11px] text-slate-500">
            Demi standar privasi dan keamanan sistem sewa, Anda diwajibkan membuat kata sandi baru pribadi Anda.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ulangi Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Konfirmasi kata sandi..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0b0f19] hover:bg-[#1e293b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Spinner size="sm" className="text-white" />}
              <span>{loading ? 'Menyimpan...' : 'Simpan Kata Sandi & Lanjutkan'}</span>
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
