'use client';
import { useContext } from 'react';
import { Search, Mic, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface MedicineSearchProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  category: string;
  setCategory: (c: string) => void;
  onVoiceSearch: () => void;
}

export function MedicineSearch({ searchTerm, setSearchTerm, category, setCategory, onVoiceSearch }: MedicineSearchProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { data: categoriesData = [] } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  const categories = ['All', ...categoriesData];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={getTranslation(language, 'auto.search_medicines_symptoms_or_brands')}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-shadow"
        />
        <button
          onClick={onVoiceSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-teal-600 hover:text-teal-800"
          title={getTranslation(language, 'auto.voice_search')}
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
        <Filter className="h-5 w-5 text-gray-400 flex-shrink-0 mr-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === 'All' ? '' : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              (category === cat || (cat === 'All' && category === ''))
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:bg-teal-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
