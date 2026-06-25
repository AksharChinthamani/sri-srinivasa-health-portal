import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/blob';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pathname = req.nextUrl.searchParams.get('pathname');
  if (!pathname) {
    return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
  }

  // Optional: Validate that the user is allowed to access this file
  // e.g., check if pathname starts with `prescriptions/${user.id}`
  if (!pathname.startsWith(`prescriptions/${user.id}`) && !pathname.startsWith(`lab-reports/${user.id}`)) {
    // If the user is an ADMIN, DOCTOR, or PHARMACIST, they might need access to these files as well.
    // For now, if they have one of these roles, we'll let them through.
    if (!['ADMIN', 'DOCTOR', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const signedUrl = await getSignedUrl(pathname);
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }
}
