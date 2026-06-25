'use client';

import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { format, isToday, isPast, isFuture } from 'date-fns';
import {
  Video,
  Calendar,
  Clock,
  Stethoscope,
  User,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
} from 'lucide-react';

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  reason?: string;
  doctor?: { user?: { name?: string }; specialty?: string };
  patient?: { user?: { name?: string } };
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-950 text-amber-400 border-amber-900',
    CONFIRMED: 'bg-teal-950 text-teal-400 border-teal-900',
    COMPLETED: 'bg-slate-800 text-slate-500 border-slate-700',
    CANCELLED: 'bg-rose-950 text-rose-500 border-rose-900',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] ?? map.PENDING}`}>
      {status}
    </span>
  );
}

export default function VirtualConsultLobbyPage() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const { user } = useAuth();
  const isDoctor = user?.role === 'DOCTOR';

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: () =>
      fetch('/api/appointments').then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      }),
  });

  // Filter to only upcoming/today appointments that aren't cancelled
  const active = appointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED',
  );
  const past = appointments.filter((a) => a.status === 'COMPLETED').slice(0, 5);

  const canJoin = (apt: Appointment) => {
    // Allow joining if today (regardless of exact time) or status is CONFIRMED/PENDING
    const aptDate = new Date(apt.date);
    return isToday(aptDate) && (apt.status === 'CONFIRMED' || apt.status === 'PENDING');
  };

  const personName = (apt: Appointment) =>
    isDoctor ? apt.patient?.user?.name ?? 'Patient' : apt.doctor?.user?.name ?? 'Doctor';
  const personLabel = isDoctor ? 'Patient' : 'Dr.';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Video className="w-6 h-6 text-teal-500" />
            {getTranslation(language, 'auto.virtual_consult')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure, peer-to-peer video consultations powered by WebRTC
          </p>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-2.5 text-sm text-teal-700 dark:text-teal-400 font-medium">
          <Wifi className="w-4 h-4" />
          <span>End-to-end encrypted · Browser-native WebRTC</span>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Calendar className="w-5 h-5 text-teal-500" />, title: 'Schedule', desc: 'Book a video appointment from the Appointments page' },
          { icon: <Video className="w-5 h-5 text-teal-500" />, title: 'Join Today', desc: 'Click "Join Call" on the day of your appointment' },
          { icon: <Stethoscope className="w-5 h-5 text-teal-500" />, title: 'Consult', desc: 'Doctor can issue e-prescriptions and SOAP notes live' },
        ].map((step) => (
          <div key={step.title} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex gap-3 items-start">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center flex-shrink-0">
              {step.icon}
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{step.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Upcoming &amp; Active Appointments
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading appointments…
          </div>
        ) : active.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No upcoming appointments</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Schedule a video appointment to get started</p>
            <Link href="/patient/appointments">
              <button className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition">
                Book Appointment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((apt) => {
              const joinable = canJoin(apt);
              const aptDate = new Date(apt.date);
              return (
                <div
                  key={apt.id}
                  className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all ${
                    joinable
                      ? 'border-teal-300 dark:border-teal-700 shadow-md shadow-teal-100 dark:shadow-teal-950/50'
                      : 'border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {/* Date/Time column */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${
                        isToday(aptDate)
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {format(aptDate, 'MMM')}
                      </span>
                      <span className="text-xl font-extrabold leading-tight">
                        {format(aptDate, 'd')}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {isToday(aptDate) ? 'Today' : format(aptDate, 'EEEE')}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {apt.time}
                      </p>
                    </div>
                  </div>

                  {/* Person info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        {isDoctor ? <User className="w-3.5 h-3.5 text-slate-500" /> : <Stethoscope className="w-3.5 h-3.5 text-teal-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {personLabel} {personName(apt)}
                        </p>
                        {apt.doctor?.specialty && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium uppercase tracking-wide">
                            {apt.doctor.specialty}
                          </p>
                        )}
                      </div>
                    </div>
                    {apt.reason && (
                      <p className="text-xs text-slate-400 mt-2 pl-9 line-clamp-1">
                        {apt.reason}
                      </p>
                    )}
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={apt.status} />
                    {joinable ? (
                      <Link href={`/consult/${apt.id}`}>
                        <button
                          id={`join-call-${apt.id}`}
                          className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-teal-600/20 hover:shadow-teal-600/40"
                        >
                          <Video className="w-4 h-4" />
                          Join Call
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {isPast(aptDate) && !isToday(aptDate) ? 'Past date' : 'Not today'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Consultations */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Recent Completed</h2>
          <div className="space-y-2">
            {past.map((apt) => (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3 opacity-70"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {personLabel} {personName(apt)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {format(new Date(apt.date), 'dd MMM yyyy')} · {apt.time}
                  </p>
                </div>
                <StatusPill status={apt.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
