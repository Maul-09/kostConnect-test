export { cn } from "cn";

/**
 * Format string atau angka dengan pemisah ribuan titik (.)
 * Contoh: "18000" -> "18.000", "1800000" -> "1.800.000"
 */
export function formatNumberWithDots(value: string | number): string {
  if (value === undefined || value === null) return '';
  const digitsOnly = String(value).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('id-ID');
}

/**
 * Mengubah string bertitik menjadi number murni
 * Contoh: "1.800.000" -> 1800000
 */
export function parseNumberFromDots(value: string | number): number {
  if (typeof value === 'number') return value;
  const digitsOnly = String(value).replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}
