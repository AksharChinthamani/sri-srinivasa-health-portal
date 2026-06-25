export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicines: PrescriptionMedicine[];
  notes?: string;
  issuedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'completed';
}

export interface PrescriptionMedicine {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}
