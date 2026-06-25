'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InventoryTable } from '@/components/admin/InventoryTable';
import { ExpiryHeatmap } from '@/components/admin/ExpiryHeatmap';
import { RestockSuggestion } from '@/components/admin/RestockSuggestion';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function InventoryPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: medicines = [], isLoading } = useQuery<any[]>({
    queryKey: ['adminInventory', search, category, filter],
    queryFn: async () => {
      const res = await fetch(`/api/inventory?search=${search}&category=${category}&filter=${filter}`);
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-secondary">{getTranslation(language, 'auto.inventory')}</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-teal-600 text-white rounded text-sm">{getTranslation(language, 'auto.bulk_import_csv')}</button>
          <button className="px-3 py-1 bg-teal-600 text-white rounded text-sm">{getTranslation(language, 'auto.generate_po')}</button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={getTranslation(language, 'auto.search_medicines')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1 flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="">{getTranslation(language, 'auto.all_categories')}</option>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="all">{getTranslation(language, 'auto.all_stock')}</option>
          <option value="low">{getTranslation(language, 'auto.low_stock')}</option>
          <option value="expiring">{getTranslation(language, 'auto.expiring_soon')}</option>
        </select>
      </div>

      {/* Inventory Table */}
      <InventoryTable medicines={medicines || []} isLoading={isLoading} />

      {/* Expiry Heatmap */}
      <ExpiryHeatmap medicines={medicines || []} />

      {/* AI Restock Suggestions */}
      <RestockSuggestion medicines={medicines || []} />
    </div>
  );
}
