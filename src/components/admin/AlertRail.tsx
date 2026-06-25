'use client';
import { useQuery } from '@tanstack/react-query';

async function fetchAlerts() {
  const res = await fetch('/api/admin/alerts');
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export function AlertRail() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAlerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000, // refresh every 30s
  });

  if (isLoading) return <div className="h-12 bg-gray-200 rounded animate-pulse"></div>;

  const alerts = data?.alerts || [];
  if (alerts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 overflow-x-auto whitespace-nowrap">
      <div className="flex gap-4">
        {alerts.map((alert: any, idx: number) => (
          <span key={idx} className="text-sm text-yellow-800">
            {alert.icon} {alert.message}
          </span>
        ))}
      </div>
    </div>
  );
}
