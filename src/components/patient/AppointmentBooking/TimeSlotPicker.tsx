'use client';
import { useContext } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function TimeSlotPicker({ slots, selectedSlot, onSelect }: { slots: string[], selectedSlot: string | null, onSelect: (slot: string) => void }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  if (!slots || slots.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700">{getTranslation(language, 'auto.select_time_slot')}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {slots.map((slot: string) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              selectedSlot === slot
                ? 'bg-teal-500 text-white border-teal-500'
                : 'border-gray-300 hover:border-teal-400'
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
