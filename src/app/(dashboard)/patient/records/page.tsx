'use client';

import { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { format } from 'date-fns';
import { FileText, Calendar, Clock, User, ChevronRight, X, Pill, ClipboardList, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal/Modal';

export default function PatientRecordsPage() {
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['patientRecords'],
    queryFn: () => fetch('/api/appointments').then(res => {
      if (!res.ok) throw new Error('Failed to fetch records');
      return res.json();
    }),
  });

  // Filter only completed appointments
  const completedRecords = appointments
    .filter((app: any) => app.status === 'COMPLETED')
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4 pt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
        Error loading medical records. Please try again.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{getTranslation(language, 'auto.medical_records')}</h1>
        <p className="text-slate-500 text-sm mt-1">View your past consultation history, doctor notes, and prescriptions.</p>
      </div>

      {completedRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Records Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            You don't have any completed consultations yet. Once a doctor completes a consultation, the records will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {completedRecords.map((record: any, index: number) => (
            <div key={record.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Timeline Marker */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <FileText className="w-4 h-4" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedRecord(record)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </span>
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {record.time}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{record.reason}</h3>
                
                <div className="flex items-center text-sm text-slate-600 mb-4">
                  <User className="w-4 h-4 mr-1.5 text-slate-400" />
                  Dr. {record.doctorName || 'Assigned Doctor'}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {record.clinicalNotes && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                        <ClipboardList className="w-3 h-3 mr-1" /> Notes
                      </span>
                    )}
                    {record.prescription && record.prescription.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                        <Pill className="w-3 h-3 mr-1" /> Rx
                      </span>
                    )}
                  </div>
                  <button className="text-xs font-bold text-primary flex items-center group-hover:underline">
                    View Report <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Details Modal */}
      <Modal 
        isOpen={!!selectedRecord} 
        onClose={() => setSelectedRecord(null)}
        title="Consultation Report"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-6">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {format(new Date(selectedRecord.date), 'MMMM dd, yyyy')}</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {selectedRecord.time}</span>
              <span className="flex items-center"><User className="w-4 h-4 mr-1.5" /> Dr. {selectedRecord.doctorName || 'Doctor'}</span>
            </div>
            
            {/* Reason for Visit */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-primary" /> Reason for Visit
              </h4>
              <p className="text-slate-900">{selectedRecord.reason}</p>
            </div>

            {/* Clinical Notes */}
            {selectedRecord.clinicalNotes && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center border-b border-slate-100 pb-2">
                  <ClipboardList className="w-4 h-4 mr-1.5 text-primary" /> Clinical Notes
                </h4>
                <div className="space-y-4">
                  {selectedRecord.clinicalNotes.observations && (
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Observations</span>
                      <p className="text-slate-800 text-sm bg-white p-3 rounded-lg border border-slate-200">{selectedRecord.clinicalNotes.observations}</p>
                    </div>
                  )}
                  {selectedRecord.clinicalNotes.diagnosis && (
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Diagnosis</span>
                      <p className="text-slate-800 text-sm bg-white p-3 rounded-lg border border-slate-200 font-medium">{selectedRecord.clinicalNotes.diagnosis}</p>
                    </div>
                  )}
                  {selectedRecord.clinicalNotes.instructions && (
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Instructions</span>
                      <p className="text-slate-800 text-sm bg-white p-3 rounded-lg border border-slate-200">{selectedRecord.clinicalNotes.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prescription */}
            {selectedRecord.prescription && selectedRecord.prescription.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center border-b border-slate-100 pb-2">
                  <Pill className="w-4 h-4 mr-1.5 text-primary" /> E-Prescription
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Medicine</th>
                        <th className="px-4 py-3">Dosage</th>
                        <th className="px-4 py-3">Frequency</th>
                        <th className="px-4 py-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.prescription.map((rx: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{rx.medicineName}</td>
                          <td className="px-4 py-3">{rx.dosage}</td>
                          <td className="px-4 py-3">{rx.frequency}</td>
                          <td className="px-4 py-3">{rx.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedRecord(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
