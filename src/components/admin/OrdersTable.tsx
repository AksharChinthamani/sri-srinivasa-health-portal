'use client';import { useContext } from 'react';

import { format } from 'date-fns';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface OrdersTableProps {
  orders: any[];
  onStatusUpdate: (orderId: string, status: string) => void;
}

export function OrdersTable({ orders, onStatusUpdate }: OrdersTableProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 pl-6">{getTranslation(language, 'auto.order_id')}</th>
              <th className="p-4">{getTranslation(language, 'auto.customer')}</th>
              <th className="p-4">{getTranslation(language, 'auto.medicines')}</th>
              <th className="p-4">{getTranslation(language, 'auto.total')}</th>
              <th className="p-4">{getTranslation(language, 'auto.date')}</th>
              <th className="p-4">{getTranslation(language, 'auto.status')}</th>
              <th className="p-4 pr-6 text-right">{getTranslation(language, 'auto.update_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  {getTranslation(language, 'auto.no_orders_found')}</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-mono text-xs text-slate-500 font-semibold">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{order.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{order.user?.email || order.user?.phone}</div>
                  </td>
                  <td className="p-4 max-w-xs truncate">
                    <div className="text-slate-800 font-medium">
                      {order.items?.map((item: any) => `${item.medicine?.name} (x${item.quantity})`).join(', ') || '—'}
                    </div>
                    {order.deliveryAddress && (
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={order.deliveryAddress}>
                        📍 {order.deliveryAddress}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-slate-900">
                    ₹{order.total.toFixed(2)}
                  </td>
                  <td className="p-4 text-slate-500">
                    {format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700"
                    >
                      <option value="PENDING">{getTranslation(language, 'auto.pending')}</option>
                      <option value="PROCESSING">{getTranslation(language, 'auto.processing')}</option>
                      <option value="SHIPPED">{getTranslation(language, 'auto.shipped')}</option>
                      <option value="DELIVERED">{getTranslation(language, 'auto.delivered')}</option>
                      <option value="CANCELLED">{getTranslation(language, 'auto.cancelled')}</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
