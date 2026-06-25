'use client';
import { useContext } from 'react';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Stethoscope, Mail, Phone, Award, Clock, X, Eye, EyeOff } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  doctorProfile: {
    specialty: string;
    qualifications: string;
    experience: number;
  } | null;
}

const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Neurologist', 'Orthopedic Surgeon',
  'Dermatologist', 'Pediatrician', 'Gynecologist', 'Psychiatrist',
  'Ophthalmologist', 'ENT Specialist', 'Gastroenterologist', 'Endocrinologist',
  'Pulmonologist', 'Nephrologist', 'Oncologist', 'Radiologist',
];

export default function AdminDoctorsPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    specialty: '', qualifications: '', experience: '',
  });

  // Fetch all doctors
  const { data: doctors = [], isLoading } = useQuery<Doctor[]>({
    queryKey: ['admin-doctors'],
    queryFn: () => fetch('/api/admin/doctors').then(r => r.json()),
  });

  // Create doctor mutation
  const createDoctor = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, experience: Number(data.experience) }),
      }).then(async r => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || 'Failed to create doctor');
        return json;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setShowAddModal(false);
      setForm({ name: '', email: '', phone: '', password: '', specialty: '', qualifications: '', experience: '' });
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  // Delete doctor mutation
  const deleteDoctor = useMutation({
    mutationFn: (doctorId: string) =>
      fetch('/api/admin/doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setDeleteConfirm(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.password || !form.specialty) {
      setFormError('Please fill all required fields.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    createDoctor.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{getTranslation(language, 'auto.doctor_management')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {getTranslation(language, 'auto.grant_and_manage_doctor_access_credentia')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition shadow-sm"
        >
          <UserPlus size={16} />
          {getTranslation(language, 'auto.grant_doctor_access')}</button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Stethoscope size={20} className="text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">{getTranslation(language, 'auto.access_control_policy')}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {getTranslation(language, 'auto.doctor_accounts_are_created_exclusively_')}</p>
        </div>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <Stethoscope size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">{getTranslation(language, 'auto.no_doctors_added_yet')}</p>
          <p className="text-slate-400 text-sm mt-1">{getTranslation(language, 'auto.click_quot_grant_doctor_access_quot_to_a')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{doc.name}</h3>
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full font-medium">
                      {doc.doctorProfile?.specialty || 'General'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(doc.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                  title={getTranslation(language, 'auto.revoke_access')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span className="truncate">{doc.email}</span>
                </div>
                {doc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" />
                    <span>{doc.phone}</span>
                  </div>
                )}
                {doc.doctorProfile?.qualifications && (
                  <div className="flex items-center gap-2">
                    <Award size={13} className="text-slate-400" />
                    <span>{doc.doctorProfile.qualifications}</span>
                  </div>
                )}
                {doc.doctorProfile?.experience !== undefined && (
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-slate-400" />
                    <span>{doc.doctorProfile.experience} {getTranslation(language, 'auto.yrs_experience')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {getTranslation(language, 'auto.added')}{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add Doctor Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{getTranslation(language, 'auto.grant_doctor_access')}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{getTranslation(language, 'auto.create_credentials_for_the_new_doctor')}</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setFormError(''); }}
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.full_name')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={getTranslation(language, 'auto.dr_arjun_mehta')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.phone')}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder={getTranslation(language, 'auto.9876543210')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Credentials */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.login_email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={getTranslation(language, 'auto.dr_arjun_healthportal_com')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={getTranslation(language, 'auto.min_8_characters')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">{getTranslation(language, 'auto.share_this_password_securely_with_the_do')}</p>
              </div>

              {/* Medical Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.specialty')}</label>
                <select
                  value={form.specialty}
                  onChange={e => setForm({ ...form, specialty: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  required
                >
                  <option value="">{getTranslation(language, 'auto.select_specialty')}</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.qualifications')}</label>
                  <input
                    type="text"
                    value={form.qualifications}
                    onChange={e => setForm({ ...form, qualifications: e.target.value })}
                    placeholder={getTranslation(language, 'auto.mbbs_md')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{getTranslation(language, 'auto.experience_years')}</label>
                  <input
                    type="number"
                    value={form.experience}
                    onChange={e => setForm({ ...form, experience: e.target.value })}
                    placeholder={getTranslation(language, 'auto.5')}
                    min="0"
                    max="60"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setFormError(''); }}
                  className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
                >
                  {getTranslation(language, 'auto.cancel')}</button>
                <button
                  type="submit"
                  disabled={createDoctor.isPending}
                  className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition disabled:opacity-60"
                >
                  {createDoctor.isPending ? 'Creating...' : 'Create Doctor Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{getTranslation(language, 'auto.revoke_doctor_access')}</h3>
            <p className="text-sm text-slate-500 mb-6">
              {getTranslation(language, 'auto.this_will_permanently_delete_the_doctor_')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-50"
              >
                {getTranslation(language, 'auto.cancel')}</button>
              <button
                onClick={() => deleteDoctor.mutate(deleteConfirm)}
                disabled={deleteDoctor.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deleteDoctor.isPending ? 'Revoking...' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
