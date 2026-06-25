export async function sendOTP(email: string, code: string) {
  // In a real application, this would use a service like Resend, SendGrid, or Nodemailer.
  // For development, we log it to the console.
  
  console.log('\n=============================================');
  console.log(`✉️ EMAIL SENT TO: ${email}`);
  console.log(`🔑 OTP CODE:      ${code}`);
  console.log(`⏱️ EXPIRES IN:    10 minutes`);
  console.log('=============================================\n');

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return true;
}
