export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (/^[1-9][0-9]{9,10}$/.test(digits)) return `55${digits}`;
  if (/^55[1-9][0-9]{9,10}$/.test(digits)) return digits;
  return null;
}
