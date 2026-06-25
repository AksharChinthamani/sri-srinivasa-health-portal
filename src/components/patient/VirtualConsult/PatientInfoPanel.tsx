'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function PatientInfoPanel({ doctorId: _doctorId }: { doctorId: string }) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { user } = useAuth();
  const [soapNote, setSoapNote] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateSOAPNotes = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/soap-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: 'Patient reports chest pain for 2 days, mild severity.',
          patientInfo: { name: user?.name, id: user?.id },
        }),
      });
      const data = await res.json();
      setSoapNote(data.soapNote);
    } catch (error) {
      console.error('Failed to generate SOAP notes:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700">{getTranslation(language, 'auto.patient_information')}</h3>
      <div className="space-y-2 text-sm">
        <p><span className="text-gray-500">{getTranslation(language, 'auto.name')}</span> {user?.name || 'Patient'}</p>
        <p><span className="text-gray-500">{getTranslation(language, 'auto.age')}</span> 32</p>
        <p><span className="text-gray-500">{getTranslation(language, 'auto.condition')}</span> {getTranslation(language, 'auto.chest_pain')}</p>
      </div>

      <hr />

      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">{getTranslation(language, 'auto.ai_soap_notes')}</h4>
        <button
          onClick={generateSOAPNotes}
          disabled={generating}
          className="w-full py-2 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Notes'}
        </button>
        {soapNote && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
            {soapNote}
          </div>
        )}
      </div>

      <hr />

      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">{getTranslation(language, 'auto.upload_prescription')}</h4>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />
      </div>
    </div>
  );
}
