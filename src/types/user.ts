export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'patient' | 'doctor' | 'pharmacy' | 'staff';
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
