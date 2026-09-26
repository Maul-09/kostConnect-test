'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT';

export interface RoleProfile {
  role: UserRole;
  name: string;
  title: string;
  badge: string;
  avatar: string;
  description: string;
  avatarBg: string;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  ADMIN: {
    role: 'ADMIN',
    name: 'Muhammad Ajiz',
    title: 'Super Admin Platform',
    badge: 'Super Admin',
    avatar: 'MA',
    description: 'Pusat tata kelola multi-mitra, lisensi ERP, dan arsitektur sistem global.',
    avatarBg: 'bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 text-white',
  },
  OWNER: {
    role: 'OWNER',
    name: 'H. Rahmat Santoso',
    title: 'Pemilik Kos Harmoni',
    badge: 'Pemilik Kos',
    avatar: 'RS',
    description: 'Pengelola operasional aset kos, kamar, kontrak sewa, dan arus kas masuk.',
    avatarBg: 'bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-300',
  },
  TENANT: {
    role: 'TENANT',
    name: 'Budi Santoso',
    title: 'Penyewa Kamar 101',
    badge: 'Penyewa Kos',
    avatar: 'BS',
    description: 'Penghuni kamar mandiri, monitoring masa sewa & pelunasan invoice Midtrans.',
    avatarBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
  },
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentProfile: RoleProfile;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('OWNER');

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
        document.title = 'KosConnect ERP • Super Admin Platform';
      } else if (role === 'OWNER') {
        document.title = 'KosConnect ERP • Pemilik Kos (Owner)';
      } else if (role === 'TENANT') {
        document.title = 'KosConnect ERP • Portal Mandiri Penyewa';
      }
    }
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, currentProfile }}>
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
