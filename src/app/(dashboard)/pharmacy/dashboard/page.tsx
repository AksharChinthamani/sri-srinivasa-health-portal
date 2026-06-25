'use client';
import { useContext } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

async function fetchDashboardData() {
  const res = await fetch('/api/pharmacy/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export default function PharmacyDashboard() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { data, isLoading, error } = useQuery({
    queryKey: ['pharmacyDashboard'],
    queryFn: fetchDashboardData,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        {getTranslation(language, 'auto.error_loading_pharmacy_dashboard')}{(error as any).message}
      </div>
    );
  }

  const { stats, recentOrders = [] } = data;

  const statCards = [
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      desc: 'Awaiting dispatch/processing',
      colorClass: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      label: 'Low Stock Alert',
      value: stats.lowStockCount,
      desc: 'Items with stock under 20',
      colorClass: stats.lowStockCount > 0 ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Active Prescriptions',
      value: stats.activePrescriptions,
      desc: 'Patient prescriptions in system',
      colorClass: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      desc: 'Excluding cancelled orders',
      colorClass: 'text-slate-900 bg-slate-50 border-slate-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{getTranslation(language, 'auto.pharmacy_dashboard')}</h1>
        <p className="text-slate-500 mt-1">{getTranslation(language, 'auto.live_overview_of_health_portal_orders_st')}</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${card.colorClass} shadow-sm flex flex-col justify-between`}>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-3xl font-black mt-2">{card.value}</p>
            </div>
            <p className="text-xs text-slate-400 mt-3">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{getTranslation(language, 'auto.recent_patient_orders')}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{getTranslation(language, 'auto.the_latest_medication_orders_submitted_b')}</p>
          </div>
          <Link
            href="/pharmacy/orders"
            className="text-teal-600 hover:text-teal-700 text-sm font-semibold hover:underline"
          >
            {getTranslation(language, 'auto.manage_all_orders')}</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 pl-6">{getTranslation(language, 'auto.order_id')}</th>
                <th className="p-4">{getTranslation(language, 'auto.customer')}</th>
                <th className="p-4">{getTranslation(language, 'auto.ordered_medicines')}</th>
                <th className="p-4">{getTranslation(language, 'auto.total')}</th>
                <th className="p-4">{getTranslation(language, 'auto.date')}</th>
                <th className="p-4 pr-6">{getTranslation(language, 'auto.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    {getTranslation(language, 'auto.no_orders_placed_yet')}</td>
                </tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-500 font-semibold">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{order.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{order.user?.email || order.user?.phone}</div>
                    </td>
                    <td className="p-4 max-w-md truncate">
                      <div className="font-semibold text-slate-800">
                        {order.items?.map((item: any) => `${item.medicine?.name} (x${item.quantity})`).join(', ') || '—'}
                      </div>
                      {order.deliveryAddress && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={order.deliveryAddress}>
                          📍 {order.deliveryAddress}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      ₹{order.total.toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-500">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
