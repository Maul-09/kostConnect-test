'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Receipt, Home } from 'lucide-react';

const navigation = [
  { name: 'Dashboard Overview', href: '/', icon: Home },
  { name: 'Properti & Kamar (Aset)', href: '/properties', icon: Building2 },
  { name: 'Penyewa & Kontrak (CRM)', href: '/tenants', icon: Users },
  { name: 'Tagihan & Payment (Keuangan)', href: '/invoices', icon: Receipt },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          {/* Logo & Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-800 block">KosConnect ERP</span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">Mini Property ERP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-150">
            <p className="text-xs font-semibold text-slate-700">KosConnect ERP (Lite)</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Assessment: Muhammad Ajiz</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            {navigation.find((item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              API Connected
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
