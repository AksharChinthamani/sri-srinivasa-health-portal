// User Profile
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'doctor' | 'pharmacist' | 'patient' | 'staff';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Appointment
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO date
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'in-person' | 'virtual';
  notes?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// Prescription
export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  status: 'active' | 'completed' | 'expired';
  notes?: string;
  issuedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// Order
export interface Order {
  id: string;
  patientId: string;
  items: Array<{
    medicineId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

// Medicine
export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  category: string;
  price: number;
  stock: number;
  expiryDate: string;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
