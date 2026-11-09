const base = import.meta.env.VITE_API_URL || "/api";
async function request(path, { body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "No se pudo conectar con la API. Verifica que el backend esté iniciado y consulta el saldo antes de repetir una operación.",
    );
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      payload?.error?.message ||
        `La solicitud falló (HTTP ${response.status}).`,
    );
  if (!payload || !("data" in payload))
    throw new Error("La API devolvió una respuesta inválida.");
  return payload.data;
}
export const getAccount = (id, signal) =>
  request(`/cuenta/${encodeURIComponent(id)}`, { signal });
export const getHistory = (id, signal) =>
  request(`/cuenta/${encodeURIComponent(id)}/historial`, { signal });
export const deposit = (cuentaId, monto) =>
  request("/cuenta/deposito", { body: { cuentaId, monto } });
export const withdraw = (cuentaId, monto) =>
  request("/cuenta/retiro", { body: { cuentaId, monto } });
export const transfer = (cuentaOrigenId, cuentaDestinoId, monto) =>
  request("/cuenta/transferencia", {
    body: { cuentaOrigenId, cuentaDestinoId, monto },
  });
