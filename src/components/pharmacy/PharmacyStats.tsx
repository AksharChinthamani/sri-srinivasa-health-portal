import React from 'react';
import { Card } from '@/components/ui/Card/Card';

export const PharmacyStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {['Total Orders', 'Pending Orders', 'Stock Value', 'Revenue'].map((stat) => (
        <Card key={stat}>
          <p className="text-gray-600 text-sm">{stat}</p>
          <p className="text-2xl font-bold mt-2">--</p>
        </Card>
      ))}
    </div>
  );
};
