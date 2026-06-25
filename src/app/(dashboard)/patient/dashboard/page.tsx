'use client';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { AIInsightCard } from '@/components/patient/AIInsightCard';
import ManageAppointmentModal from '@/components/patient/ManageAppointmentModal';
import PendingOrdersModal from '@/components/patient/PendingOrdersModal';
import { useContext, useState } from 'react';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';

async function fetchDashboardData() {
  const res = await fetch('/api/patient/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const { data, isLoading, error } = useQuery({
    queryKey: ['patientDashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: (query) => {
      // Poll every 5s if there is a confirmed appointment waiting to start
      const app = (query.state.data as any)?.upcomingAppointment;
      return app && app.status === 'CONFIRMED' ? 5000 : false;
    }
  });

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return getTranslation(language, 'dashboard.good_morning');
    if (hour < 18) return getTranslation(language, 'dashboard.good_afternoon');
    return getTranslation(language, 'dashboard.good_evening');
  })();

  const cardHoverClass = 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-300';

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse pb-10">
        <div className="h-10 bg-slate-200 rounded w-1/3 mb-8"></div>
        <div className="h-24 bg-slate-200 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{getTranslation(language, 'auto.error_loading_dashboard')}{error.message}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting}, <span className="text-teal-700">{user?.name || getTranslation(language, 'auto.patient')}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1">{getTranslation(language, 'dashboard.summary')}</p>
      </header>

      {/* AI Insight Card */}
      <AIInsightCard />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div 
          onClick={() => { if (data?.upcomingAppointment) setManageModalOpen(true); }}
          className={`bg-white border rounded-2xl p-5 ${cardHoverClass} shadow-sm flex flex-col justify-between ${data?.upcomingAppointment ? 'cursor-pointer' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">{getTranslation(language, 'dashboard.upcoming_appointment')}</div>
            {data?.upcomingAppointment && (
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">Manage</span>
            )}
          </div>
          {data.upcomingAppointment ? (
            <div className="mt-2 flex flex-col justify-between h-full">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {format(new Date(data.upcomingAppointment.date), 'EEE, MMM d, h:mm a')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-semibold text-teal-600">{data.upcomingAppointment.doctor}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${data.upcomingAppointment.type === 'in-person' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {data.upcomingAppointment.type === 'in-person' ? 'IN-PERSON' : 'VIRTUAL'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{data.upcomingAppointment.specialty}</p>
              </div>
              {data.upcomingAppointment.status === 'IN_PROGRESS' && data.upcomingAppointment.type !== 'in-person' && (
                <Link 
                  href={`/consult/${data.upcomingAppointment.id}`} 
                  className="mt-3 block"
                  onClick={e => e.stopPropagation()}
                >
                  <button className="w-full text-center bg-teal-600 hover:bg-teal-700 text-white py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-sm animate-pulse">
                    Join Video Consult Now</button>
                </Link>
              )}
              {data.upcomingAppointment.status === 'CONFIRMED' && data.upcomingAppointment.type !== 'in-person' && (
                <div className="mt-3 text-center text-xs font-bold text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  Waiting for doctor to start...
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 mt-2">{getTranslation(language, 'auto.none_scheduled')}</p>
          )}
        </div>
        <div className={`bg-white border rounded-2xl p-5 ${cardHoverClass} shadow-sm flex flex-col justify-between`}>
          <div className="text-slate-500 text-sm font-medium">{getTranslation(language, 'dashboard.active_prescriptions')}</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{data.activePrescriptions}</div>
        </div>
        <div 
          onClick={() => setOrdersModalOpen(true)}
          className={`bg-white border rounded-2xl p-5 ${cardHoverClass} shadow-sm flex flex-col justify-between cursor-pointer`}
        >
          <div className="flex justify-between items-start">
            <div className="text-slate-500 text-sm font-medium">{getTranslation(language, 'dashboard.pending_orders')}</div>
            {data?.pendingOrders > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg">View</span>
            )}
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{data.pendingOrders}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          

          {/* Hero Card: Book Appointment */}
          <section className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row ${cardHoverClass}`}>
            <div className="bg-teal-600 p-6 text-white sm:w-1/3 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-2">{getTranslation(language, 'auto.book_appointment')}</h2>
              <p className="text-teal-100 text-sm mb-4">{getTranslation(language, 'auto.consult_with_top_specialists_in_minutes')}</p>
              <Link href="/patient/appointments/book" className="inline-block bg-white text-teal-700 font-bold py-2 px-4 rounded-lg text-center w-full hover:bg-slate-50 transition-colors">
                {getTranslation(language, 'auto.book_now')}</Link>
            </div>
            <div className="p-6 sm:w-2/3 grid grid-cols-7 gap-2 bg-slate-50">
              {/* Mock Mini Calendar */}
              <div className="col-span-7 flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700">{getTranslation(language, 'auto.june_2026')}</span>
              </div>
              {['M','T','W','T','F','S','S'].map(d => <div key={'head-'+d} className="text-center text-xs font-semibold text-slate-400">{d}</div>)}
              {Array.from({length: 14}).map((_, i) => (
                <div key={i} className={`h-8 w-8 mx-auto flex items-center justify-center text-sm rounded-full cursor-pointer 
                  ${i === 5 ? 'bg-teal-600 text-white font-bold shadow-md' : i < 3 ? 'text-slate-300' : 'hover:bg-slate-200 text-slate-700 font-medium'}`}>
                  {i + 10}
                </div>
              ))}
            </div>
          </section>


        </div>

      </div>

      {data?.upcomingAppointment && (
        <ManageAppointmentModal
          isOpen={manageModalOpen}
          onClose={() => setManageModalOpen(false)}
          appointmentId={data.upcomingAppointment.id}
        />
      )}

      <PendingOrdersModal 
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
      />
    </div>
  );
}
