import { afterEach, expect, test, vi } from 'vitest';
import { deposit, getAccount, transfer } from '../src/services/api.js';
afterEach(() => vi.unstubAllGlobals());
test('servicio envía JSON numérico al endpoint obligatorio', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ok: true } }) });
  vi.stubGlobal('fetch', fetch);
  expect(await deposit('001-000001', 15.9)).toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith('/api/cuenta/deposito', expect.objectContaining({ method: 'POST', body: '{"cuentaId":"001-000001","monto":15.9}' }));
  await transfer('001-000001', '001-000002', 1);
  expect(fetch.mock.lastCall[0]).toBe('/api/cuenta/transferencia');
});
test('servicio conserva mensaje de error HTTP de negocio', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: 'Saldo insuficiente.' } }) }));
  await expect(deposit('001-000001', 1)).rejects.toThrow('Saldo insuficiente.');
});
test('servicio informa conexión fallida', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
  await expect(getAccount('001-000001')).rejects.toThrow('No se pudo conectar');
});
test('servicio informa HTTP sin JSON y respuesta inválida', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw Error(); } }));
  await expect(getAccount('001-000001')).rejects.toThrow('HTTP 500');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  await expect(getAccount('001-000001')).rejects.toThrow('respuesta inválida');
});
