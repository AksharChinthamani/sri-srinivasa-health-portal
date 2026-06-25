'use client';

import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';
import { ToastContext } from '@/context/ToastContext';
import { Trash2, Play, Pause, AlertTriangle } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function PatientSubscriptionsPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const toastContext = useContext(ToastContext);
  const queryClient = useQueryClient();

  // Fetch subscriptions from database
  const { data: dbSubscriptions = [], isLoading } = useQuery<any[]>({
    queryKey: ['patientSubscriptions'],
    queryFn: () => fetch('/api/subscriptions').then(res => {
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return res.json();
    }),
  });

  // Fetch medicines for setup dropdown
  const { data: medicines = [] } = useQuery<any[]>({
    queryKey: ['activeMedicinesForRefill'],
    queryFn: () => fetch('/api/medicines').then(res => {
      if (!res.ok) throw new Error('Failed to fetch medicines');
      return res.json();
    }),
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (newSub: { medicineId: string; quantity: number; frequency: string }) =>
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create subscription');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientSubscriptions'] });
      toastContext?.addToast('Auto-refill setup successfully!', 'success');
      setShowSetupModal(false);
      setSelectedMedicineId('');
      setNewQty(30);
      setNewFreq('Monthly');
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Failed to setup auto-refill', 'error');
    }
  });

  // Update status mutation (Pause / Resume)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update subscription status');
        return res.json();
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patientSubscriptions'] });
      toastContext?.addToast(`Subscription ${variables.status.toLowerCase()}d successfully!`, 'success');
      setConfirmAction(null);
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Failed to update subscription', 'error');
    }
  });

  // Delete/Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/subscriptions?id=${id}`, {
        method: 'DELETE',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to cancel subscription');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientSubscriptions'] });
      toastContext?.addToast('Subscription cancelled successfully!', 'success');
      setConfirmAction(null);
    },
    onError: (err: any) => {
      toastContext?.addToast(err.message || 'Failed to cancel subscription', 'error');
    }
  });

  // Setup Refill Modal State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [newQty, setNewQty] = useState(30);
  const [newFreq, setNewFreq] = useState<'Monthly' | 'Bi-Monthly'>('Monthly');

  // Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<{ id: string, action: 'PAUSED' | 'ACTIVE' | 'Cancel', medName: string } | null>(null);

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineId) return;

    createMutation.mutate({
      medicineId: selectedMedicineId,
      quantity: newQty,
      frequency: newFreq,
    });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;

    if (action === 'Cancel') {
      cancelMutation.mutate(id);
    } else {
      statusMutation.mutate({ id, status: action });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{getTranslation(language, 'auto.my_subscriptions')}</h1>
          <p className="text-slate-500 text-sm mt-1">{getTranslation(language, 'auto.manage_your_automated_medicine_refills')}</p>
        </div>
        <button 
          onClick={() => setShowSetupModal(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {getTranslation(language, 'auto.setup_auto_refill')}</button>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dbSubscriptions.map(sub => {
          const isPaused = sub.status === 'PAUSED';
          const nextDispatchDate = new Date(sub.nextDispatch);
          const daysRemaining = differenceInDays(nextDispatchDate, today);
          const totalCycleDays = sub.frequency === 'Bi-Monthly' || sub.frequency === 'bi-monthly' ? 60 : 30;
          
          // Calculate progress percentage
          const progressPercent = isPaused ? 0 : Math.max(0, Math.min(100, ((totalCycleDays - daysRemaining) / totalCycleDays) * 100));
          const circleCircumference = 2 * Math.PI * 36; // r=36
          const strokeDashoffset = circleCircumference - (progressPercent / 100) * circleCircumference;

          return (
            <div key={sub.id} className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-sm relative overflow-hidden transition-all ${isPaused ? 'opacity-75 grayscale-[0.2]' : ''}`}>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{sub.medicine?.name || 'Unknown Medicine'}</h3>
                  <p className="text-sm text-slate-500">{sub.quantity} {getTranslation(language, 'auto.units')}{sub.frequency}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  !isPaused ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {sub.status}
                </span>
              </div>

              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {/* Circular Progress Countdown */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-200" />
                    {!isPaused && (
                      <circle 
                        cx="48" cy="48" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" 
                        className="text-teal-500 transition-all duration-1000 ease-out"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {!isPaused ? (
                      <>
                        <span className="text-xl font-bold text-slate-900 leading-none">{daysRemaining}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{getTranslation(language, 'auto.days')}</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-amber-600">--</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{getTranslation(language, 'auto.next_dispatch')}</p>
                  <p className="text-lg font-bold text-slate-800 font-mono">
                    {!isPaused ? format(nextDispatchDate, 'dd MMM yyyy') : 'Paused'}
                  </p>
                  {!isPaused && (
                    <p className="text-[10px] text-slate-400 mt-1">{getTranslation(language, 'auto.auto_dispatch_at_threshold_refill')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!isPaused ? (
                  <button 
                    onClick={() => setConfirmAction({ id: sub.id, action: 'PAUSED', medName: sub.medicine?.name || 'Medicine' })}
                    className="flex-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-sm rounded-xl transition-colors border border-amber-200 flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-4 h-4" /> {getTranslation(language, 'auto.pause')}</button>
                ) : (
                  <button 
                    onClick={() => setConfirmAction({ id: sub.id, action: 'ACTIVE', medName: sub.medicine?.name || 'Medicine' })}
                    className="flex-1 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-sm rounded-xl transition-colors border border-teal-200 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4" /> {getTranslation(language, 'auto.resume')}</button>
                )}
                <button 
                  onClick={() => setConfirmAction({ id: sub.id, action: 'Cancel', medName: sub.medicine?.name || 'Medicine' })}
                  className="flex-1 py-2 bg-white text-red-600 hover:bg-rose-50 font-bold text-sm rounded-xl transition-colors border border-slate-200 hover:border-red-200 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> {getTranslation(language, 'auto.cancel')}</button>
              </div>

            </div>
          );
        })}

        {dbSubscriptions.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{getTranslation(language, 'auto.no_active_subscriptions')}</h3>
            <p className="text-slate-500 text-sm">{getTranslation(language, 'auto.set_up_auto_refills_to_never_run_out_of_')}</p>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSetupModal(false)}></div>
          <form onSubmit={handleSetupSubmit} className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full relative z-10 border border-slate-200 animate-in zoom-in-95 duration-200 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">{getTranslation(language, 'auto.setup_auto_refill')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{getTranslation(language, 'auto.select_medicine')}</label>
                <select 
                  required
                  value={selectedMedicineId}
                  onChange={e => setSelectedMedicineId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{getTranslation(language, 'auto.choose_medicine')}</option>
                  {medicines.map((med: any) => (
                    <option key={med.id} value={med.id}>
                      {med.name} ({med.dosage}) - ${med.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{getTranslation(language, 'auto.quantity')}</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  placeholder={getTranslation(language, 'auto.quantity_units')}
                  value={newQty}
                  onChange={e => setNewQty(Number(e.target.value) || 1)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{getTranslation(language, 'auto.frequency')}</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewFreq('Monthly')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${newFreq === 'Monthly' ? 'bg-teal-50 text-teal-700 border-teal-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{getTranslation(language, 'auto.monthly')}</button>
                  <button type="button" onClick={() => setNewFreq('Bi-Monthly')} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${newFreq === 'Bi-Monthly' ? 'bg-teal-50 text-teal-700 border-teal-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{getTranslation(language, 'auto.bi_monthly')}</button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600">
              {getTranslation(language, 'auto.a_reminder_will_be_sent_3_days_before_di')}</div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowSetupModal(false)} className="flex-1 py-3 text-slate-600 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">{getTranslation(language, 'auto.close')}</button>
              <button type="submit" disabled={createMutation.isPending} className="flex-1 py-3 text-white font-bold bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center">
                {createMutation.isPending ? 'Starting...' : 'Start Subscription'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full relative z-10 border border-slate-200 animate-in zoom-in-95 duration-200 text-center">
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              confirmAction.action === 'Cancel' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
            }`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">{getTranslation(language, 'auto.are_you_sure')}</h2>
            <p className="text-slate-500 text-sm mb-6">
              {getTranslation(language, 'auto.you_are_about_to')}{confirmAction.action === 'Cancel' ? 'cancel' : confirmAction.action.toLowerCase()} {getTranslation(language, 'auto.the_subscription_for')}<strong className="text-slate-800">{confirmAction.medName}</strong>.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 text-slate-600 font-bold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">{getTranslation(language, 'auto.no_go_back')}</button>
              <button 
                onClick={executeAction} 
                className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors ${
                  confirmAction.action === 'Cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {getTranslation(language, 'auto.yes_confirm')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
