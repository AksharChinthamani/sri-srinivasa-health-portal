'use client';
import { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LanguageContext } from '@/context/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ToastContext } from '@/context/ToastContext';
import { DoctorCard } from '@/components/patient/AppointmentBooking/DoctorCard';
import { TimeSlotPicker } from '@/components/patient/AppointmentBooking/TimeSlotPicker';
import { ConfirmationModal } from '@/components/patient/AppointmentBooking/ConfirmationModal';
import { AIRecommendation } from '@/components/patient/AppointmentBooking/AIRecommendation';

export default function BookAppointmentPage() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<'virtual' | 'in-person'>('virtual');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  const toastContext = useContext(ToastContext);

  // Fetch doctors for the selected date
  const { data: doctors = [], isLoading } = useQuery<any[]>({
    queryKey: ['doctors', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/doctors?date=${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Handle month navigation
  const goToPrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const goToNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  // Generate days for the current month view (simplified)
  const daysInMonth = Array.from({ length: 35 }, (_, i) => {
    const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    day.setDate(day.getDate() + i - day.getDay());
    return day;
  });

  const handleDoctorSelect = (doctor: any) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null); // reset slot when doctor changes
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id, // Flattened doctorProfile.id
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedSlot,
          reason: 'General consultation',
          type: consultationType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      toastContext?.addToast('Appointment booked successfully!', 'success');
      setShowConfirmation(false);
      router.push('/patient/dashboard');
    } catch (error: any) {
      console.error('Booking error:', error);
      toastContext?.addToast(error.message || 'Failed to book appointment', 'error');
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-6">{getTranslation(language, 'book_appointment.title')}</h1>

      {/* AI Recommendation Strip */}
      <AIRecommendation />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-4 h-fit">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold">{format(selectedDate, 'MMMM yyyy')}</span>
            <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].map((d) => (
              <div key={d} className="font-medium text-gray-500 py-1">{getTranslation(language, `book_appointment.${d}`)}</div>
            ))}
            {daysInMonth.map((day, idx) => {
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              const isPast = day < new Date() && !isToday;
              return (
                <button
                  key={idx}
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast}
                  className={`py-1 rounded-full text-sm transition ${
                    isSelected ? 'bg-teal-500 text-white' :
                    isToday ? 'border-2 border-teal-500' :
                    isPast ? 'text-gray-300 cursor-not-allowed' :
                    'hover:bg-teal-50 text-gray-700'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Doctors List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>)}
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-gray-500">{getTranslation(language, 'book_appointment.no_doctors')}</p>
          ) : (
            doctors.map((doctor: any) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                isSelected={selectedDoctor?.id === doctor.id}
                onSelect={() => handleDoctorSelect(doctor)}
              />
            ))
          )}

          {selectedDoctor && (
            <>
              <TimeSlotPicker
                slots={selectedDoctor.slots}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
              />
              
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Consultation Type</h3>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${consultationType === 'virtual' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="radio" name="type" value="virtual" checked={consultationType === 'virtual'} onChange={() => setConsultationType('virtual')} className="hidden" />
                    <span className="flex items-center gap-2">📹 Virtual</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${consultationType === 'in-person' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                    <input type="radio" name="type" value="in-person" checked={consultationType === 'in-person'} onChange={() => setConsultationType('in-person')} className="hidden" />
                    <span className="flex items-center gap-2">🏥 In-Person</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => setShowConfirmation(true)}
            disabled={!selectedSlot || !selectedDoctor}
            className="mt-6 w-full bg-teal-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-700 transition"
          >
            {getTranslation(language, 'book_appointment.confirm_btn')}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedDoctor && selectedSlot && (
        <ConfirmationModal
          doctor={selectedDoctor}
          date={selectedDate}
          slot={selectedSlot}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
}
