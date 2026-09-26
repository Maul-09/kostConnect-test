'use client';

import Link from 'next/link';
import { Building2, Users, Receipt, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const cards = [
    {
      title: 'Modul 1: Properti & Kamar',
      desc: 'Kelola unit kamar, harga sewa bulanan, dan pantau status kamar real-time (AVAILABLE / OCCUPIED).',
      href: '/properties',
      icon: Building2,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      badge: 'Asset Module',
    },
    {
      title: 'Modul 2: Penyewa & Kontrak',
      desc: 'Kelola data tenant, durasi sewa, dan alur kontrak aktif otomatis mengubah status kamar.',
      href: '/tenants',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'CRM Module',
    },
    {
      title: 'Modul 3: Billing & Midtrans',
      desc: 'Penerbitan tagihan sewa bulanan, simulasi Midtrans Snap pembayaran, dan otomatisasi webhook.',
      href: '/invoices',
      icon: Receipt,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      badge: 'Financial Module',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-8 text-white shadow-sm">
        <span className="inline-block px-3 py-1 bg-indigo-500/40 border border-indigo-400/30 text-indigo-100 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          Sistem ERP Mini Bisnis Kos / Kontrakan
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Selamat Datang di KosConnect ERP
        </h2>
        <p className="mt-2 text-indigo-100 max-w-2xl text-sm leading-relaxed">
          Platform operasional terintegrasi: Kamar (Aset) $\rightarrow$ Disewa (Kontrak) $\rightarrow$ Terbit Tagihan (Invoicing) $\rightarrow$ Pembayaran (Midtrans) $\rightarrow$ Notifikasi (n8n).
        </p>
      </div>

      {/* 3 Core Modules Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-150 px-2.5 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{card.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{card.desc}</p>
              </div>

              <Link
                href={card.href}
                className="mt-6 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 group"
              >
                Buka Modul <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
