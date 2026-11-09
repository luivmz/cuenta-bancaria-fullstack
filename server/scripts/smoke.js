import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { config } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Account } from '../src/models/Account.js';
import { Transaction } from '../src/models/Transaction.js';
const base = process.env.API_URL || `http://127.0.0.1:${config.port}`;
const ids = [];
async function call(path, body) {
  const response = await fetch(`${base}/api${path}`, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return (await response.json()).data;
}
try {
  assert.equal((await call('/health')).status, 'ok');
  await connectDatabase(config.mongoUri);
  // Never modifies seeded/customer accounts; cleanup only IDs created by this run.
  const token = randomInt(100000, 999998);
  for (const number of [token, token + 1]) {
    const account = await Account.create({ accountNumber: `999-${number}`, holderName: 'Smoke temporal', balance: 10000 });
    ids.push(account._id);
  }
  const source = `999-${token}`; const destination = `999-${token + 1}`;
  assert.equal((await call(`/cuenta/${source}`)).balanceCents, 10000);
  assert.equal((await call('/cuenta/deposito', { cuentaId: source, monto: 15.9 })).account.balanceCents, 11590);
  assert.equal((await call('/cuenta/retiro', { cuentaId: source, monto: 5.9 })).account.balanceCents, 11000);
  const result = await call('/cuenta/transferencia', { cuentaOrigenId: source, cuentaDestinoId: destination, monto: 10 });
  assert.equal(result.sourceAccount.balanceCents, 10000);
  assert.equal(result.destinationAccount.balanceCents, 11000);
  const history = await call(`/cuenta/${source}/historial`);
  assert.deepEqual(history.map((t) => t.type), ['TRANSFER', 'WITHDRAWAL', 'DEPOSIT']);
  assert.equal((await call(`/cuenta/${destination}/historial`))[0].id, history[0].id);
  console.log('SMOKE OK: health, consulta, depósito, retiro, transferencia, historial (6/6).');
} catch (error) {
  console.error('SMOKE FAILED:', error.message); process.exitCode = 1;
} finally {
  try {
    if (ids.length) {
      await Transaction.deleteMany({ $or: [{ sourceAccount: { $in: ids } }, { destinationAccount: { $in: ids } }] });
      await Account.deleteMany({ _id: { $in: ids } });
    }
  } finally { await disconnectDatabase(); }
}
