export function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+91 ${match[1]} ${match[2]} ${match[3]}`;
  }
  return phone;
}

export function formatPAN(pan: string): string {
  return pan.toUpperCase();
}
