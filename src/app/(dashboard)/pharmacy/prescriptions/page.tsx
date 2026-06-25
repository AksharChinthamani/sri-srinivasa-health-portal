'use client';
import { useContext } from 'react';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isBefore } from 'date-fns';
import { Search, FileText } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function PharmacyPrescriptionsPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);

  const { data: prescriptions = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['pharmacyPrescriptions'],
    queryFn: () => fetch('/api/prescriptions').then(res => {
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return res.json();
    }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredPrescriptions = prescriptions.filter((p: any) => {
    const patientName = p.patient?.user?.name || '';
    const doctorName = p.doctor?.user?.name || '';
    const query = search.toLowerCase();
    return patientName.toLowerCase().includes(query) || doctorName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        {getTranslation(language, 'auto.error_loading_prescriptions')}{(error as any).message}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{getTranslation(language, 'auto.prescriptions_lookup')}</h1>
        <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.review_active_patient_prescriptions_chec')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Table List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col h-[75vh]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50/50 shrink-0">
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder={getTranslation(language, 'auto.search_patient_doctor_or_prescription_id')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
              />
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-4 pl-6">{getTranslation(language, 'auto.prescription_id')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.patient')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.issued_by')}</th>
                  <th className="p-4">{getTranslation(language, 'auto.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((p: any) => {
                  const issuedDate = new Date(p.issuedAt);
                  const expiryDate = new Date(p.expiresAt);
                  const isExpired = isBefore(expiryDate, today) || p.status === 'expired';

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedPrescription(p)}
                      className={`transition-colors cursor-pointer ${selectedPrescription?.id === p.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-4 pl-6">
                        <div className="font-mono font-bold text-slate-900">#{p.id.slice(-8).toUpperCase()}</div>
                        <div className="text-[10px] text-slate-400">{getTranslation(language, 'auto.issued')}{format(issuedDate, 'dd MMM yyyy')}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{p.patient?.user?.name || 'Unknown Patient'}</div>
                        <div className="text-[10px] text-slate-400">{p.patient?.user?.phone || 'No phone'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{p.doctor?.user?.name || 'Unknown Doctor'}</div>
                        <div className="text-[10px] text-slate-400">{p.doctor?.specialty || 'General'}</div>
                      </td>
                      <td className="p-4 pr-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isExpired ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-green-100 text-green-700 border-green-200'
                        }`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredPrescriptions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">{getTranslation(language, 'auto.no_prescriptions_found_matching_your_sea')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl h-[75vh] flex flex-col overflow-hidden">
          {selectedPrescription ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Detail Header */}
              <div className="bg-slate-900 p-6 text-white shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selectedPrescription.patient?.user?.name || 'Patient'}</h2>
                    <p className="text-slate-400 font-mono text-sm">{getTranslation(language, 'auto.id')}{selectedPrescription.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isBefore(new Date(selectedPrescription.expiresAt), today)
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                      : 'bg-green-500/20 text-green-400 border-green-500/50'
                  }`}>
                    {isBefore(new Date(selectedPrescription.expiresAt), today) ? 'Expired' : 'Active'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{getTranslation(language, 'auto.doctor')}</div>
                    <div className="font-semibold text-slate-200">{selectedPrescription.doctor?.user?.name || 'Doctor'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{getTranslation(language, 'auto.expiry_date')}</div>
                    <div className="font-mono text-slate-200">{format(new Date(selectedPrescription.expiresAt), 'dd MMM yyyy')}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="bg-teal-50 border-b border-teal-100 p-4 shrink-0 text-xs text-teal-800">
                  <strong>{getTranslation(language, 'auto.doctor_notes')}</strong> {selectedPrescription.notes}
                </div>
              )}

              {/* Medicines List */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{getTranslation(language, 'auto.prescribed_medicines')}</h3>
                
                <div className="space-y-3">
                  {selectedPrescription.medicines?.map((med: any) => (
                    <div key={med.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800 text-sm">{med.medicineName}</span>
                        <span className="bg-slate-100 text-slate-600 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                          {med.duration}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">{getTranslation(language, 'auto.dosage')}</span>
                          <span className="font-semibold text-slate-700">{med.dosage}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">{getTranslation(language, 'auto.frequency')}</span>
                          <span className="font-semibold text-slate-700">{med.frequency}</span>
                        </div>
                      </div>
                      {med.instructions && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-400 italic">
                          {getTranslation(language, 'auto.instructions')}{med.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Fulfill */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0 text-center text-xs text-slate-400 font-medium">
                {getTranslation(language, 'auto.verify_medical_identity_and_age_prior_to')}</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>{getTranslation(language, 'auto.select_a_prescription_from_the_table_to_')}</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
