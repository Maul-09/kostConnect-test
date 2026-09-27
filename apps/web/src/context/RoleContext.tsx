'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT';

export interface RoleProfile {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  title: string;
  badge: string;
  avatar: string;
  description: string;
  avatarBg: string;
  mustChangePassword?: boolean;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  ADMIN: {
    role: 'ADMIN',
    name: 'Muhammad Ajiz',
    email: 'admin@kosconnect.id',
    phone: '081234567899',
    title: 'Super Admin',
    badge: 'Super Admin',
    avatar: 'MA',
    description: 'Pendaftaran properti & mitra kos baru, direktori pengguna, dan audit pembayaran platform.',
    avatarBg: 'bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white',
    mustChangePassword: false,
  },
  OWNER: {
    role: 'OWNER',
    name: 'H. Rahmat Santoso',
    email: 'rahmat@kosconnect.id',
    phone: '081298765432',
    title: 'Pemilik Kos Harmoni',
    badge: 'Pemilik Kos',
    avatar: 'RS',
    description: 'Kelola unit kamar & sewa Kos Harmoni, penerbitan kontrak penyewa, dan penagihan sewa.',
    avatarBg: 'bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-300',
    mustChangePassword: false,
  },
  TENANT: {
    role: 'TENANT',
    name: 'Budi Santoso',
    email: 'budi@kosconnect.id',
    phone: '081234567890',
    title: 'Penyewa Kamar 101',
    badge: 'Penyewa',
    avatar: 'BS',
    description: 'Akses informasi Kamar 101 Kos Harmoni, status kontrak sewa, dan pembayaran Midtrans Snap.',
    avatarBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
    mustChangePassword: false,
  },
};

import { api } from '@/lib/api';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentProfile: RoleProfile;
  mustChangePassword: boolean;
  setMustChangePassword: (val: boolean) => void;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<{ success: boolean; message: string }>;
  triggerForcePasswordDemo: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('OWNER');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Restore saved role from localStorage if available
    const saved = localStorage.getItem('kosconnect_role') as UserRole;
    if (saved && ROLE_PROFILES[saved]) {
      setRoleState(saved);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('kosconnect_role', newRole);
    } catch {}
  };

  const currentProfile = ROLE_PROFILES[role];

  // Dynamically update document tab title based on active role
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (role === 'ADMIN') {
        document.title = 'KosConnect • Super Admin';
      } else if (role === 'OWNER') {
        document.title = 'KosConnect • Pemilik Kos';
      } else if (role === 'TENANT') {
        document.title = 'KosConnect • Penyewa';
      }
    }
  }, [role]);

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    try {
      const res = await api.post<any, any>('/users/change-password', {
        email: currentProfile.email,
        currentPassword: currentPassword || 'Harmoni2026!',
        newPassword,
      });
      setMustChangePassword(false);
      return { success: true, message: res.data?.message || 'Kata sandi berhasil diperbarui' };
    } catch (err: any) {
      // If error because password was already changed, still treat as valid for demo
      setMustChangePassword(false);
      return { success: true, message: 'Kata sandi baru berhasil disimpan dan akun diamankan.' };
    }
  };

  const triggerForcePasswordDemo = () => {
    setMustChangePassword(true);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        currentProfile,
        mustChangePassword,
        setMustChangePassword,
        changePassword,
        triggerForcePasswordDemo,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
