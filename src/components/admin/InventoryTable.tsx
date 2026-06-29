'use client';

import { useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface InventoryTableProps {
  medicines: any[];
  isLoading: boolean;
}

export function InventoryTable({ medicines, isLoading }: InventoryTableProps) {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/inventory?id=${id}`, { method: 'DELETE' }).then((res) => {
        if (!res.ok) throw new Error('Failed to delete medicine');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update medicine');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 pl-6">{getTranslation(language, 'auto.medicine_name')}</th>
              <th className="p-4">{getTranslation(language, 'auto.dosage')}</th>
              <th className="p-4">{getTranslation(language, 'auto.category')}</th>
              <th className="p-4">{getTranslation(language, 'auto.price')}</th>
              <th className="p-4">{getTranslation(language, 'auto.stock')}</th>
              <th className="p-4">{getTranslation(language, 'auto.expiry_date')}</th>
              <th className="p-4">{getTranslation(language, 'auto.status')}</th>
              <th className="p-4 pr-6 text-right">{getTranslation(language, 'auto.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">
                  {getTranslation(language, 'auto.no_medicines_found_in_inventory')}
                </td>
              </tr>
            ) : (
              medicines.map((med) => {
                const isLow = med.stock <= 20;
                const isOutOfStock = med.stock === 0;

                return (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-900">{med.name}</td>
                    <td className="p-4 text-slate-600">{med.dosage}</td>
                    <td className="p-4 text-slate-600 font-medium">{med.category}</td>
                    <td className="p-4 font-semibold text-slate-800">₹{med.price.toFixed(2)}</td>
                    <td className="p-4 font-mono font-semibold">
                      <span
                        className={
                          isOutOfStock ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                        }
                      >
                        {med.stock}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {med.expiryDate ? format(new Date(med.expiryDate), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          med.active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {med.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: med.id, active: !med.active })
                        }
                        className="text-xs font-bold text-teal-600 hover:text-teal-800"
                      >
                        {med.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${med.name}?`)) {
                            deleteMutation.mutate(med.id);
                          }
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        {getTranslation(language, 'auto.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
