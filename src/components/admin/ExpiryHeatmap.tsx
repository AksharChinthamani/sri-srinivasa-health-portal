'use client';import { useContext } from 'react';

import { format, addDays, differenceInDays } from 'date-fns';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

interface ExpiryHeatmapProps {
  medicines: any[];
}

export function ExpiryHeatmap({ medicines }: ExpiryHeatmapProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  // Generate 28 days starting from today
  const startDate = new Date();
  const days = Array.from({ length: 28 }, (_, i) => addDays(startDate, i));

  // Helper to check risk for a specific day
  const getDayRisk = (day: Date) => {
    const expiringOnDay = medicines.filter((med) => {
      const expDate = new Date(med.expiryDate);
      return (
        expDate.getFullYear() === day.getFullYear() &&
        expDate.getMonth() === day.getMonth() &&
        expDate.getDate() === day.getDate() &&
        med.active
      );
    });

    if (expiringOnDay.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastOrToday = expiringOnDay.some(m => new Date(m.expiryDate) <= today);
      return {
        level: isPastOrToday ? 'high' : 'medium',
        color: isPastOrToday ? 'bg-red-500 shadow-sm ring-1 ring-red-600' : 'bg-amber-400 shadow-sm ring-1 ring-amber-500',
        title: `${expiringOnDay.map((m) => m.name).join(', ')} expiring (${isPastOrToday ? 'critical' : 'soon'})`,
      };
    }

    return {
      level: 'safe',
      color: 'bg-teal-50',
      title: 'No expiry risk',
    };
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nearExpiryCount = medicines.filter((med) => {
    if (!med.active) return false;
    const diff = differenceInDays(new Date(med.expiryDate), today);
    return diff > 0 && diff <= 30;
  }).length;

  const expiredCount = medicines.filter((med) => {
    if (!med.active) return false;
    const diff = differenceInDays(new Date(med.expiryDate), today);
    return diff <= 0;
  }).length;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <h2 className="font-bold text-slate-900 mb-1">{getTranslation(language, 'auto.expiry_heat_map')}</h2>
        <p className="text-xs text-slate-500 mb-4">{getTranslation(language, 'auto.upcoming_28_days_risk_analysis')}</p>

        <div className="grid grid-cols-7 gap-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-slate-400 mb-1">
              {d}
            </div>
          ))}

          {days.map((day, i) => {
            const risk = getDayRisk(day);
            return (
              <div
                key={i}
                className={`aspect-square rounded-md ${risk.color} flex items-center justify-center text-[10px] text-white font-bold cursor-help transition-transform hover:scale-110`}
                title={`${format(day, 'MMM d, yyyy')}: ${risk.title}`}
              ></div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-between text-[11px] text-slate-500 font-bold">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-teal-50 border border-teal-100"></div> {getTranslation(language, 'auto.safe')}</div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-amber-400"></div> {getTranslation(language, 'auto.near_expiry_30d')}</div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-red-500"></div> {getTranslation(language, 'auto.expired_risk_today')}</div>
        </div>
      </div>

      <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <div className="text-xs text-red-600 font-bold uppercase tracking-wider">{getTranslation(language, 'auto.expired_expiring_today')}</div>
            <div className="text-2xl font-bold text-red-800 mt-1">{expiredCount} {getTranslation(language, 'auto.items')}</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <div className="text-xs text-amber-700 font-bold uppercase tracking-wider">{getTranslation(language, 'auto.expiring_within_30_days')}</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">{nearExpiryCount} {getTranslation(language, 'auto.items')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
