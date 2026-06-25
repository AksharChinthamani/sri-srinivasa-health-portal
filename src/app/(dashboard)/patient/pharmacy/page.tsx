'use client';

import { useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MedicineSearch } from '@/components/patient/Pharmacy/MedicineSearch';
import { MedicineCard } from '@/components/patient/Pharmacy/MedicineCard';
import { CartSidebar } from '@/components/patient/Pharmacy/CartSidebar';
import { useCartStore } from '@/store/cartStore';
import { DrugInteractionBanner } from '@/components/patient/Pharmacy/DrugInteractionBanner';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

export default function PharmacyPage() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [showCart, setShowCart] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: medicines = [], isLoading } = useQuery<any[]>({
    queryKey: ['medicines', debouncedSearch, category],
    queryFn: async () => {
      const res = await fetch(
        `/api/medicines?search=${encodeURIComponent(debouncedSearch)}&category=${encodeURIComponent(category)}`
      );
      if (!res.ok) throw new Error('Failed to fetch medicines');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Check for drug interactions (if cart has 2+ items)
  const showInteractionBanner = isClient && cartItems.length >= 2;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{getTranslation(language, 'auto.pharmacy')}</h1>
          <p className="text-slate-500 mt-1">{getTranslation(language, 'auto.order_medicines_and_get_them_delivered_t')}</p>
        </div>
        <button
          onClick={() => setShowCart(true)}
          className="relative p-3 bg-white border border-slate-200 rounded-full hover:border-teal-500 hover:bg-teal-50 transition-colors shadow-sm"
        >
          <span className="text-xl">🛒</span>
          {isClient && cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filters */}
      <MedicineSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        category={category}
        setCategory={setCategory}
        onVoiceSearch={() => alert('Voice search coming soon!')}
      />

      {/* Drug Interaction Banner */}
      {showInteractionBanner && <DrugInteractionBanner items={cartItems} />}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse mb-4"></div>
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2 mb-4"></div>
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl mt-6 shadow-sm">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-xl font-bold text-slate-800">{getTranslation(language, 'auto.no_medicines_found')}</h3>
          <p className="text-slate-500 mt-2">{getTranslation(language, 'auto.try_adjusting_your_search_or_filters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {medicines.map((med: any) => (
            <MedicineCard key={med.id} medicine={med} />
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}
