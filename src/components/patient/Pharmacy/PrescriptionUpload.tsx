'use client';
import { useContext } from 'react';
import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface PrescriptionUploadProps {
  onClose: () => void;
  onDetected: (medicines: any[]) => void;
}

export function PrescriptionUpload({ onClose, onDetected }: PrescriptionUploadProps) {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleOCR = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(image, 'eng', {
        logger: m => console.log(m)
      });
      setText(text);
      // Simple parsing: look for medicine names (you'd improve this)
      const lines = text.split('\n');
      const medicineNames = lines.filter(line => line.trim().length > 3);
      onDetected(medicineNames.map(name => ({ name, dosage: '', price: 0 })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{getTranslation(language, 'auto.upload_prescription')}</h3>
            <p className="text-sm text-slate-500">{getTranslation(language, 'auto.we_apos_ll_scan_it_and_add_items_to_your')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-200 bg-teal-50/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 transition-colors group"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-teal-500 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} />
            </div>
            <p className="font-semibold text-slate-700">{getTranslation(language, 'auto.click_to_upload_image')}</p>
            <p className="text-xs text-slate-500 mt-1">{getTranslation(language, 'auto.png_jpg_or_pdf_max_5mb')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={image} alt={getTranslation(language, 'auto.prescription')} className="w-full h-48 object-contain" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <button
              onClick={handleOCR}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {getTranslation(language, 'auto.scanning_document')}</>
              ) : (
                'Scan & Auto-add items'
              )}
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {text && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
            <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span className="text-teal-500">✨</span> {getTranslation(language, 'auto.raw_text_detected')}</p>
            <p className="text-slate-600 whitespace-pre-wrap font-mono text-xs max-h-32 overflow-y-auto">{text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
