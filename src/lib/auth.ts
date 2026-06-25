import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production');

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      id: payload.id as string,
      name: (payload.name as string) || 'User',
      email: payload.email as string,
      role: (payload.role as string) as 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'STAFF' | 'PATIENT',
    };
  } catch (error) {
    console.error('getUserFromRequest error:', error);
    return null;
  }
}
