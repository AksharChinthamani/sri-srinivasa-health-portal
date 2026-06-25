'use client';
import { useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function RevenueChart({ data }: { data: any[] }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border h-72 flex items-center justify-center text-gray-500 lg:col-span-2">
        {getTranslation(language, 'auto.no_revenue_data_available')}</div>
    );
  }

  const formattedData = data.map(item => ({
    month: format(new Date(item.month), 'MMM yy'),
    revenue: Number(item.revenue || 0)
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
      <h2 className="text-lg font-bold mb-6 text-slate-800">{getTranslation(language, 'auto.revenue_last_12_months')}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#0d9488" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 6 }} 
            />
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} dx={-10} />
            <Tooltip 
              formatter={(value: any) => [`₹${value}`, 'Revenue']}
              labelStyle={{ color: '#334155', fontWeight: 'bold', marginBottom: '4px' }}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
