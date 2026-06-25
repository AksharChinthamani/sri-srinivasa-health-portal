# Prescription Upload & Viewing Integration

This plan outlines how the new Vercel Blob storage will be integrated into the Doctor and Patient workflows for handling prescriptions.

## User Review Required
> [!IMPORTANT]
> Please review the UI placement decisions below to ensure they match your expected workflow.

## Proposed Changes

### 1. Doctor Dashboard (`src/app/(dashboard)/doctor/dashboard/page.tsx`)
- **Action**: Add an **"Upload Prescription"** button to the appointment cards.
- **Workflow**: 
  - Doctors will be able to click this button on appointments (e.g., after or during a consultation).
  - Clicking it will open a Modal containing the `PrescriptionUpload` component.
  - The component will upload the file to Vercel Blob and save the metadata (including patient ID and appointment ID) to the Firestore `prescriptions` collection.

### 2. New Component: `PrescriptionUploadModal` (`src/components/doctor/PrescriptionUploadModal.tsx`)
- **[NEW]** A reusable modal component implementing the `PrescriptionUpload` logic provided in Step 5.
- It will accept `patientId` and `appointmentId` as props.
- It will handle the file selection, upload process via `uploadPrescription(file, patientId)`, and Firestore `addDoc` to the `prescriptions` collection.

### 3. Patient Prescriptions Page (`src/app/(dashboard)/patient/prescriptions/page.tsx`)
- **[MODIFY]** Update the existing prescriptions list to detect if a prescription has an associated `fileUrl` / `filePath`.
- If a file exists, it will render the `PrescriptionView` component.

### 4. New Component: `PrescriptionView` (`src/components/patient/PrescriptionView.tsx`)
- **[NEW]** Implement the component from Step 5 that fetches a signed URL using `getSignedUrl(pathname)` or via the secure API route `/api/blob/signed-url` and displays the image or a link to the PDF.

## Open Questions
- Do you want doctors to *only* upload file attachments (images/PDFs), or do you want them to also fill out an e-prescription text form (medicines, dosage, frequency) at the same time in this new modal? Currently, the provided `PrescriptionUpload` code only uploads a file.
