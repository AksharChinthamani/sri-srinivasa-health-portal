'use client';
import { useContext } from 'react';

import { useQuery } from '@tanstack/react-query';
import { format, isBefore } from 'date-fns';
import { FileText, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import React, { useState } from "react";
import { PrescriptionView } from '@/components/patient/PrescriptionView';
import { PaymentModal } from '@/components/patient/PaymentModal';
import { useRouter } from 'next/navigation';

export default function PatientPrescriptionsPage() {
    const langContext = useContext(LanguageContext);
    const language = langContext?.language || 'en';
    const [orderingId, setOrderingId] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
    const router = useRouter();
  const { data: prescriptions = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['patientPrescriptions'],
    queryFn: () => fetch('/api/prescriptions').then(res => {
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return res.json();
    }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        {getTranslation(language, 'auto.error_loading_prescriptions')}{(error as any).message}
      </div>
    );
  }

  const handleBuyMedicine = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmOrder = async (address: string, paymentMethod: 'cod' | 'online') => {
    if (!selectedPrescription) return;
    setOrderingId(selectedPrescription.id);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedPrescription.medicines,
          deliveryAddress: address,
          isPrescription: true,
          prescriptionId: selectedPrescription.id,
          paymentMethod: paymentMethod
        })
      });
      if (!res.ok) throw new Error("Failed to place order");
      
      const data = await res.json();
      setIsPaymentModalOpen(false);
      router.push(`/patient/orders/${data.order?.id || selectedPrescription.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{getTranslation(language, 'auto.prescriptions')}</h1>
        <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.view_details_dosage_instructions_and_act')}</p>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-6">
        {prescriptions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{getTranslation(language, 'auto.no_prescriptions_found')}</h3>
            <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.you_do_not_have_any_active_or_past_presc')}</p>
          </div>
        ) : (
          prescriptions.map((prescription) => {
            const issuedDate = new Date(prescription.issuedAt);
            const expiryDate = new Date(prescription.expiresAt);
            const isExpired = isBefore(expiryDate, today) || prescription.status === 'expired';
            const docName = prescription.doctor?.user?.name || 'Unknown Doctor';
            const docSpecialty = prescription.doctor?.specialty || 'General Practitioner';

            return (
              <div
                key={prescription.id}
                className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${
                  isExpired ? 'opacity-85' : ''
                }`}
              >
                {/* Prescription Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold text-lg border border-teal-100">
                      📄
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">{docName}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{docSpecialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{getTranslation(language, 'auto.issued')}{format(issuedDate, 'dd MMM yyyy')}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{getTranslation(language, 'auto.expires')}{format(expiryDate, 'dd MMM yyyy')}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isExpired 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                    {!isExpired && prescription.medicines?.length > 0 && (
                      <button
                        onClick={() => handleBuyMedicine(prescription)}
                        disabled={orderingId === prescription.id || orderSuccess === prescription.id}
                        className="ml-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        {orderingId === prescription.id ? 'Ordering...' : orderSuccess === prescription.id ? 'Ordered ✓' : '🛒 Buy Medicine'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Prescription Content */}
                <div className="p-6 space-y-6">
                  {prescription.notes && (
                    <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4 text-sm text-teal-800 flex gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">{getTranslation(language, 'auto.doctor_notes')}</strong>
                        <span>{prescription.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Medicines List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{getTranslation(language, 'auto.prescribed_medicines')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prescription.medicines?.map((med: any) => (
                        <div key={med.id || med.medicineName} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-teal-200 transition-colors">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-slate-800 text-sm">{med.medicineName}</h4>
                              <span className="bg-slate-100 text-slate-600 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                                {med.duration}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-slate-500 font-medium">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block">{getTranslation(language, 'auto.dosage')}</span>
                                <span className="text-slate-700 font-bold">{med.dosage}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase block">{getTranslation(language, 'auto.frequency')}</span>
                                <span className="text-slate-700 font-bold">{med.frequency}</span>
                              </div>
                            </div>
                          </div>

                          {med.instructions && (
                            <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400 italic">
                              💡 {med.instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {prescription.filePath && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Attached Document</h3>
                        <PrescriptionView pathname={prescription.filePath} fileName={prescription.fileName} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={0} // Prescription total usually calculated by pharmacist later
        onConfirm={handleConfirmOrder}
      />
    </div>
  );
}
