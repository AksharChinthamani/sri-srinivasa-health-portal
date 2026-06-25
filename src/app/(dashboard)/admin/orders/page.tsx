'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function AdminOrdersPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', statusFilter, page],
    queryFn: () =>
      fetch(`/api/admin/orders?status=${statusFilter}&page=${page}`).then(res => res.json()),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-gray-200 rounded"></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">{getTranslation(language, 'auto.orders')}</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="">{getTranslation(language, 'auto.all')}</option>
          <option value="PENDING">{getTranslation(language, 'auto.pending')}</option>
          <option value="PROCESSING">{getTranslation(language, 'auto.processing')}</option>
          <option value="SHIPPED">{getTranslation(language, 'auto.shipped')}</option>
          <option value="DELIVERED">{getTranslation(language, 'auto.delivered')}</option>
          <option value="CANCELLED">{getTranslation(language, 'auto.cancelled')}</option>
        </select>
      </div>
      <OrdersTable
        orders={data?.orders || []}
        onStatusUpdate={(orderId, status) =>
          updateStatusMutation.mutate({ orderId, status })
        }
      />
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">{getTranslation(language, 'auto.total')}{data?.total || 0}</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            {getTranslation(language, 'auto.previous')}</button>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!data?.orders || data.orders.length < 20}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            {getTranslation(language, 'auto.next')}</button>
        </div>
      </div>
    </div>
  );
}
