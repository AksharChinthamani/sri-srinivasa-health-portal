'use client';
import { useContext } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Phone, CheckCircle, Clock } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React from "react";

export function QueueList({ tokens, onComplete }: { tokens: any[]; onComplete: (id: string) => void }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="divide-y divide-gray-200">
        {tokens.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{getTranslation(language, 'auto.no_patients_in_queue')}</div>
        ) : (
          tokens.map((token) => (
            <div key={token.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  token.status === 'CALLED' ? 'bg-green-500' : 'bg-teal-500'
                }`}>
                  {token.tokenNumber}
                </div>
                <div>
                  <p className="font-medium">{token.patient.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>{getTranslation(language, 'auto.waiting')}{formatDistanceToNow(new Date(token.createdAt), { addSuffix: true })}</span>
                    {token.status === 'CALLED' && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Phone size={14} /> {getTranslation(language, 'auto.called')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {token.status === 'CALLED' && (
                  <button
                    onClick={() => onComplete(token.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> {getTranslation(language, 'auto.complete')}</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
