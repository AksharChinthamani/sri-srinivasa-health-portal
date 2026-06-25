/**
 * Server-side Firebase helpers (API routes only).
 * Re-exports adminDb as `db` and adminAuth so all API routes that were
 * written with the client SDK signature can just change their import path.
 *
 * Usage in API routes:
 *   import { db } from '@/lib/firebase/server';
 */
export { adminDb as db, adminAuth } from './admin';
