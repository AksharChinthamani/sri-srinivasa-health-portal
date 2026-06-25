'use client';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { AppointmentChart } from '@/components/admin/AppointmentChart';
import { MedicineCategoryDonut } from '@/components/admin/MedicineCategoryDonut';
import { AlertRail } from '@/components/admin/AlertRail';
import { RevenueForecast } from '@/components/admin/RevenueForecast';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

async function fetchDashboardData() {
  const res = await fetch('/api/admin/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

// Safe fallback data to prevent crashes when API is loading/erroring
const fallbackStats = {
  revenueToday: 0,
  activePatients: 0,
  appointmentsToday: 0,
  expiringMedicines: 0,
  lowStockMedicines: 0,
  pendingOrders: 0,
};

export default function AdminDashboardPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: fetchDashboardData,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-600 font-semibold">{getTranslation(language, 'auto.failed_to_load_dashboard_data')}</p>
        <p className="text-slate-500 text-sm">{getTranslation(language, 'auto.please_refresh_the_page_or_check_your_co')}</p>
      </div>
    );
  }

  const stats = data?.stats ?? fallbackStats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-secondary">{getTranslation(language, 'auto.admin_dashboard')}</h1>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/doctors">
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition">
              {getTranslation(language, 'auto.add_doctor')}</button>
          </Link>
          <Link href="/admin/inventory">
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition">
              {getTranslation(language, 'auto.add_medicine')}</button>
          </Link>
        </div>
      </div>

      <DashboardStats stats={stats} />

      {/* Alert Rail */}
      <AlertRail />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart data={data?.revenueLast12Months ?? []} />
        <MedicineCategoryDonut data={data?.medicineCategories ?? []} />
        <AppointmentChart data={data?.appointmentsLast7Days ?? []} />
      </div>

      <RevenueForecast />
    </div>
  );
}
