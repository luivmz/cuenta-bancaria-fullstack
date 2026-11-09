import { invalid } from './errors.js';
export const MAX_CENTS = Number.MAX_SAFE_INTEGER;

export function toCents(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw invalid('El monto debe ser un número finito mayor que cero.');
  }
  // Parse decimal digits, never use floating-point multiplication to store money.
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw invalid('El monto admite como máximo dos decimales.');
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
  if (cents > BigInt(MAX_CENTS)) throw invalid('El monto excede el límite permitido.');
  return Number(cents);
}
export const toSoles = (cents) => cents / 100;
export function accountId(value) {
  if (typeof value !== 'string' || !/^\d{3}-\d{6}$/.test(value)) {
    throw invalid('La cuenta debe tener el formato 001-000001.');
  }
  return value;
}
export function bodyFields(body, expected) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some((key) => !expected.includes(key))) {
    throw invalid('El cuerpo contiene campos inválidos.');
  }
}
