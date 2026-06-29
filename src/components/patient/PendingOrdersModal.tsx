import React, { useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

interface PendingOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingOrdersModal({ isOpen, onClose }: PendingOrdersModalProps) {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: isOpen,
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['patientDashboard'] });
    },
  });

  if (!isOpen) return null;

  const pendingOrders = orders?.filter((order: any) => order.status === 'pending') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Pending Orders</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-white flex-grow">
          {isLoading ? (
            <div className="text-center text-slate-500 py-8">Loading your orders...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">Failed to load orders.</div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="text-slate-500 text-lg font-medium">You have no pending orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order: any) => (
                <div key={order.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider mb-2">
                        {order.isPrescription && <span className="bg-blue-500 text-white px-1.5 rounded-sm mr-1">Rx</span>}
                        {order.status}
                      </span>
                      <p className="text-sm font-semibold text-slate-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(order.createdAt), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      {order.total > 0 && <p className="text-lg font-bold text-slate-900">₹{order.total.toFixed(2)}</p>}
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this order?')) {
                            cancelMutation.mutate(order.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="text-sm font-semibold text-red-500 hover:text-red-700 mt-2 disabled:opacity-50"
                      >
                        {cancelMutation.isPending ? 'Canceling...' : 'Cancel Order'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Items:</p>
                    <ul className="space-y-2">
                      {(order.items || []).map((item: any, index: number) => (
                        <li key={index} className="flex justify-between text-sm">
                          <span className="text-slate-700 font-medium">
                            <span className="text-slate-400 mr-2">{item.quantity}x</span> 
                            {item.name} {item.dosage && `(${item.dosage})`}
                          </span>
                          {item.price > 0 && <span className="text-slate-500">₹{(item.price * item.quantity).toFixed(2)}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
