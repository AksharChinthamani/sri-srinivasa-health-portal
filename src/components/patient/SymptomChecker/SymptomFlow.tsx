'use client';
import { useContext } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Step components
import { PainLocationSelector } from './PainLocationSelector';
import { DurationSelector } from './DurationSelector';
import { SeveritySlider } from './SeveritySlider';
import { AdditionalSymptoms } from './AdditionalSymptoms';
import { ResultCard } from './ResultCard';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

type Step = 'location' | 'duration' | 'severity' | 'symptoms' | 'result';

export function SymptomFlow() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('location');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    location: '',
    duration: '',
    severity: 1,
    symptoms: [] as string[],
  });

  const steps: Step[] = ['location', 'duration', 'severity', 'symptoms', 'result'];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep === 'symptoms') {
      handleAnalyze();
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    if (currentStep === 'result') return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
      setCurrentStep('result');
    } catch (error) {
      console.error('Analysis failed:', error);
      // Show toast
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (result?.specialist) {
      router.push(`/patient/appointments/book?specialist=${encodeURIComponent(result.specialist)}`);
    } else {
      router.push('/patient/appointments/book');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'location':
        return (
          <PainLocationSelector
            value={formData.location}
            onChange={(location: string) => setFormData({ ...formData, location })}
          />
        );
      case 'duration':
        return (
          <DurationSelector
            value={formData.duration}
            onChange={(duration: string) => setFormData({ ...formData, duration })}
          />
        );
      case 'severity':
        return (
          <SeveritySlider
            value={formData.severity}
            onChange={(severity: number) => setFormData({ ...formData, severity })}
          />
        );
      case 'symptoms':
        return (
          <AdditionalSymptoms
            value={formData.symptoms}
            onChange={(symptoms: string[]) => setFormData({ ...formData, symptoms })}
          />
        );
      case 'result':
        return <ResultCard result={result} onBookAppointment={handleBookAppointment} />;
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'location': return !!formData.location;
      case 'duration': return !!formData.duration;
      case 'severity': return formData.severity >= 1 && formData.severity <= 10;
      case 'symptoms': return true; // optional
      case 'result': return true;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {currentStep !== 'result' && (
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{getTranslation(language, 'auto.pain_location')}</span>
            <span>{getTranslation(language, 'auto.duration')}</span>
            <span>{getTranslation(language, 'auto.severity')}</span>
            <span>{getTranslation(language, 'auto.symptoms')}</span>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <p className="mt-4 text-gray-500">{getTranslation(language, 'auto.analyzing_your_symptoms')}</p>
          </div>
        ) : (
          renderStep()
        )}
      </div>

      {/* Navigation */}
      {currentStep !== 'result' && !loading && (
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} /> {getTranslation(language, 'auto.back')}</button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === 'symptoms' ? 'Analyze' : 'Next'}
            {currentStep !== 'symptoms' && <ChevronRight size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
