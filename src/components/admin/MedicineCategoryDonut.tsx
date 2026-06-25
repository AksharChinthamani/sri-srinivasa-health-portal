'use client';
import { useContext } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

export function MedicineCategoryDonut({ data }: { data: any[] }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border h-72 flex items-center justify-center text-gray-500">
        {getTranslation(language, 'auto.no_category_data')}</div>
    );
  }

  const formattedData = data.map(item => ({
    name: item.category || 'Unknown',
    value: Number(item._count || 0)
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-lg font-bold mb-6 text-slate-800">{getTranslation(language, 'auto.medicines_by_category')}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', color: '#475569' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
