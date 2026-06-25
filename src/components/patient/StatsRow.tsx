import React from 'react';
import { Card } from '@/components/ui/Card/Card';

interface Stat {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export const StatsRow: React.FC<{ stats: Stat[] }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
            <div className="text-4xl">{stat.icon || '📊'}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};
