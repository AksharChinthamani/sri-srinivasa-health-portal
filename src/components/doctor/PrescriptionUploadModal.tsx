'use client';
import React, { useState } from 'react';
import { uploadPrescription } from '@/lib/blob';
import { X, Plus, Trash2, FileText, UploadCloud } from 'lucide-react';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  appointmentId?: string;
}

export default function PrescriptionUploadModal({ isOpen, onClose, patientId, patientName, appointmentId }: PrescriptionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<{ medicineName: string; dosage: string; frequency: string; duration: string; instructions: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines([...medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const newMeds = [...medicines];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedicines(newMeds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (medicines.length === 0 && !file) {
      setError('Please add at least one medicine or attach a file.');
      return;
    }

    setUploading(true);
    try {
      let fileData = null;
      if (file) {
        const { downloadUrl, pathname } = await uploadPrescription(file, patientId, appointmentId);
        fileData = {
          fileUrl: downloadUrl,
          filePath: pathname,
          fileName: file.name,
        };
      }

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentId,
          notes,
          medicines: medicines.filter(m => m.medicineName.trim() !== ''),
          ...fileData
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create prescription');
      }

      alert('Prescription created successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while uploading.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Prescription</h2>
            <p className="text-sm text-slate-500">For patient: <span className="font-semibold text-slate-700">{patientName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* E-Prescription Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  E-Prescription Details
                </h3>
                <button 
                  type="button" 
                  onClick={handleAddMedicine}
                  className="text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              {medicines.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-sm">
                  No medicines added yet. Click "Add Medicine" to prescribe digitally.
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map((med, index) => (
                    <div key={index} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm relative group">
                      <button 
                        onClick={() => handleRemoveMedicine(index)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medicine Name</label>
                          <input 
                            type="text" 
                            value={med.medicineName}
                            onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="e.g. Paracetamol 500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dosage & Frequency</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={med.dosage}
                              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                              className="w-1/2 text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                              placeholder="e.g. 1 Tablet"
                            />
                            <input 
                              type="text" 
                              value={med.frequency}
                              onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                              className="w-1/2 text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                              placeholder="e.g. Twice daily"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</label>
                          <input 
                            type="text" 
                            value={med.duration}
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="e.g. 5 Days"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Instructions (Optional)</label>
                          <input 
                            type="text" 
                            value={med.instructions}
                            onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                            placeholder="e.g. After meals"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Doctor Notes */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Doctor Notes</h3>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none min-h-[100px]"
                placeholder="Any additional notes or advice for the patient..."
              />
            </section>

            {/* File Upload Attachment */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UploadCloud size={16} className="text-indigo-500" />
                Attach File (Optional)
              </h3>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-center hover:bg-slate-100 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="text-indigo-700 font-semibold flex flex-col items-center gap-2">
                    <FileText size={32} className="text-indigo-500" />
                    <span>{file.name}</span>
                    <span className="text-xs text-indigo-400 font-normal">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="text-slate-500 flex flex-col items-center gap-2">
                    <UploadCloud size={32} className="text-slate-300" />
                    <span className="font-semibold text-slate-700">Click to attach a scanned prescription or document</span>
                    <span className="text-xs text-slate-400">PDF, JPG, or PNG (Max 5MB)</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition"
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={uploading || (medicines.length === 0 && !file)}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-sm"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Prescription'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
