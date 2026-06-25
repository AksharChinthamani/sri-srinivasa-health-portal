import { put, del, list, head, PutBlobResult } from '@vercel/blob';
import { getDownloadUrl as getBlobDownloadUrl } from '@vercel/blob';

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

// ========================================
// 1. Generic Upload
// ========================================

/**
 * Upload a file to Vercel Blob
 * @param file - File or Buffer (or Blob)
 * @param fileName - Name to store as (with extension)
 * @param folder - Optional folder/path prefix (e.g., 'prescriptions/user123')
 * @param isPublic - Whether file is publicly accessible (default: false)
 * @returns { url, pathname, downloadUrl }
 */
export async function uploadFile(
  file: File | Buffer | Blob,
  fileName: string,
  folder: string = '',
  isPublic: boolean = false
): Promise<{ url: string; pathname: string; downloadUrl: string }> {
  const path = folder ? `${folder}/${fileName}` : fileName;
  const blob = await put(path, file, {
    access: isPublic ? 'public' : 'private',
    token: BLOB_TOKEN,
  });
  return {
    url: blob.url,
    pathname: blob.pathname,
    downloadUrl: blob.downloadUrl,
  };
}

// ========================================
// 2. Domain‑Specific Uploads
// ========================================

/**
 * Upload user avatar (public)
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `avatar.${extension}`;
  const { url } = await uploadFile(file, fileName, `avatars/${userId}`, true);
  return url; // public URL, accessible by anyone
}

/**
 * Upload prescription (private)
 */
export async function uploadPrescription(
  file: File,
  patientId: string,
  appointmentId?: string
): Promise<{ url: string; pathname: string; downloadUrl: string }> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const folder = appointmentId
    ? `prescriptions/${patientId}/${appointmentId}`
    : `prescriptions/${patientId}`;
  return await uploadFile(file, fileName, folder, false);
}

/**
 * Upload lab report (private)
 */
export async function uploadLabReport(
  file: File,
  patientId: string,
  testName: string
): Promise<{ url: string; pathname: string; downloadUrl: string }> {
  const timestamp = Date.now();
  const fileName = `${testName}_${timestamp}_${file.name}`;
  return await uploadFile(file, fileName, `lab-reports/${patientId}`, false);
}

/**
 * Upload insurance document (private)
 */
export async function uploadInsuranceDocument(
  file: File,
  patientId: string,
  claimId: string
): Promise<{ url: string; pathname: string; downloadUrl: string }> {
  const fileName = `${claimId}_${file.name}`;
  return await uploadFile(file, fileName, `insurance/${patientId}`, false);
}

/**
 * Upload medicine image (public – for product display)
 */
export async function uploadMedicineImage(
  file: File,
  medicineId: string
): Promise<string> {
  const fileName = `${medicineId}_${file.name}`;
  const { url } = await uploadFile(file, fileName, `medicines`, true);
  return url;
}

// ========================================
// 3. Download (get signed URL)
// ========================================

/**
 * Get a signed download URL for a private file (valid for 1 hour by default)
 */
export async function getSignedUrl(pathname: string, expiresIn: number = 3600): Promise<string> {
  // For Vercel Blob, we can use `head` to get the downloadUrl (it's already a signed URL)
  const blob = await head(pathname, { token: BLOB_TOKEN });
  return blob.downloadUrl;
}

/**
 * Alternative: get a signed URL using the Vercel Blob `getDownloadUrl` function (newer)
 */
export async function getDownloadUrl(pathname: string, expiresIn: number = 3600): Promise<string> {
  const blob = await head(pathname, { token: BLOB_TOKEN });
  return blob.downloadUrl;
}

// ========================================
// 4. Delete
// ========================================

/**
 * Delete a file by its pathname (or URL)
 */
export async function deleteFile(pathname: string): Promise<void> {
  await del(pathname, { token: BLOB_TOKEN });
}

/**
 * Delete a file by its URL (extract pathname)
 */
export async function deleteFileByUrl(url: string): Promise<void> {
  // Vercel Blob URLs look like: https://<host>/<pathname>
  const pathname = new URL(url).pathname.slice(1); // remove leading slash
  await deleteFile(pathname);
}

// ========================================
// 5. List files in a folder
// ========================================

export async function listFilesInFolder(folder: string): Promise<Array<{ url: string; pathname: string; size: number }>> {
  const result = await list({ prefix: folder, token: BLOB_TOKEN });
  return result.blobs.map(blob => ({
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
  }));
}

// ========================================
// 6. Get file metadata
// ========================================

export async function getFileMetadata(pathname: string) {
  return await head(pathname, { token: BLOB_TOKEN });
}
