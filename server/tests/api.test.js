import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase, database } from '../src/config/database.js';
import { Account } from '../src/models/Account.js';
import { Transaction } from '../src/models/Transaction.js';
import { MAX_CENTS } from '../src/utils/money.js';
const dbName = `cuenta_bancaria_test_${randomUUID().replaceAll('-', '')}`;
const uri = new URL(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017');
uri.pathname = `/${dbName}`;
const a = '001-000001'; const b = '001-000002'; const missing = '001-999999';
const balance = async (id) => (await request(app).get(`/api/cuenta/${id}`).expect(200)).body.data.balanceCents;
const post = (operation, body) => request(app).post(`/api/cuenta/${operation}`).send(body);

describe('API con MongoDB real y base temporal exclusiva', { concurrency: false }, () => {
  before(async () => {
    await connectDatabase(uri.toString());
    assert.equal(mongoose.connection.name, dbName);
    await Promise.all([Account.init(), Transaction.init()]);
    console.log(`MongoDB test mode: ${database.transactions ? 'transaction' : 'standalone'}`);
  });
  beforeEach(async () => {
    database.halted = false;
    await Transaction.deleteMany({}); await Account.deleteMany({});
    await Account.create([
      { accountNumber: a, holderName: '  Luis  ', balance: 10000 },
      { accountNumber: b, holderName: 'Ana', balance: 20000 },
      { accountNumber: '001-000003', holderName: 'Carlos', balance: 0 },
    ]);
  });
  after(async () => {
    try {
      if (mongoose.connection.name === dbName && mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally { await disconnectDatabase(); }
  });
  test('health confirma DB y modo', async () => {
    const response = await request(app).get('/api/health').expect(200);
    assert.equal(response.body.data.status, 'ok');
    assert.equal(response.body.data.consistency, database.transactions ? 'transaction' : 'compensating-single-process');
  });
  test('consulta cuenta existente sin campos internos', async () => {
    const { body } = await request(app).get(`/api/cuenta/${a}`).expect(200);
    assert.deepEqual(body.data, { id: a, accountNumber: a, holderName: 'Luis', balance: 100, balanceCents: 10000, currency: 'PEN' });
  });
  test('consulta inexistente 404', () => request(app).get(`/api/cuenta/${missing}`).expect(404));
  test('identificador malformado 400', () => request(app).get('/api/cuenta/invalid').expect(400));
  test('depósito exacto con historial', async () => {
    const result = await post('deposito', { cuentaId: a, monto: 15.9 }).expect(200);
    assert.equal(result.body.data.account.balanceCents, 11590);
    const { body } = await request(app).get(`/api/cuenta/${a}/historial`).expect(200);
    assert.equal(body.data[0].type, 'DEPOSIT'); assert.equal(body.data[0].amountCents, 1590);
    assert.equal(body.data[0].sourceAccount, null); assert.equal(body.data[0].destinationAccount.accountNumber, a);
  });
  for (const operation of ['deposito', 'retiro']) {
    for (const [label, monto] of [['cero', 0], ['negativo', -1], ['texto', '20'], ['null', null], ['booleano', true], ['subcentavo', 1.001], ['ausente', undefined]]) {
      test(`${operation} rechaza monto ${label} sin mutaciones`, async () => {
        await post(operation, { cuentaId: a, monto }).expect(400);
        assert.equal(await balance(a), 10000); assert.equal(await Transaction.countDocuments(), 0);
      });
    }
    test(`${operation} cuenta inexistente 404`, () => post(operation, { cuentaId: missing, monto: 1 }).expect(404));
    test(`${operation} sin cuenta 400`, () => post(operation, { monto: 1 }).expect(400));
  }
  test('retiro válido registra origen', async () => {
    const { body } = await post('retiro', { cuentaId: a, monto: 20 }).expect(200);
    assert.equal(body.data.account.balanceCents, 8000); assert.equal(body.data.transaction.type, 'WITHDRAWAL');
    assert.equal(body.data.transaction.sourceAccount.accountNumber, a); assert.equal(body.data.transaction.destinationAccount, null);
  });
  test('retiro igual al saldo deja cero', async () => {
    await post('retiro', { cuentaId: a, monto: 100 }).expect(200); assert.equal(await balance(a), 0);
  });
  test('retiro mayor al saldo sin cambios ni historial', async () => {
    await post('retiro', { cuentaId: a, monto: 100.01 }).expect(400);
    assert.equal(await balance(a), 10000); assert.equal(await Transaction.countDocuments(), 0);
  });
  test('transferencia conserva total y aparece una vez en ambos historiales', async () => {
    const { body } = await post('transferencia', { cuentaOrigenId: a, cuentaDestinoId: b, monto: 40.15 }).expect(200);
    assert.equal(body.data.sourceAccount.balanceCents, 5985); assert.equal(body.data.destinationAccount.balanceCents, 24015);
    assert.equal(await balance(a) + await balance(b), 30000);
    for (const id of [a, b]) {
      const history = (await request(app).get(`/api/cuenta/${id}/historial`).expect(200)).body.data;
      assert.equal(history.length, 1); assert.equal(history[0].id, body.data.transaction.id);
      assert.equal(history[0].sourceAccount.accountNumber, a); assert.equal(history[0].destinationAccount.accountNumber, b);
    }
    assert.equal(await Transaction.countDocuments(), 1);
  });
  for (const [label, source, destination, monto, status] of [
    ['cero', a, b, 0, 400], ['negativo', a, b, -1, 400], ['texto', a, b, '1', 400],
    ['origen inexistente', missing, b, 1, 404], ['destino inexistente', a, missing, 1, 404],
    ['fondos insuficientes', a, b, 101, 400], ['misma cuenta', a, a, 1, 400],
    ['sin origen', undefined, b, 1, 400], ['sin destino', a, undefined, 1, 400], ['sin monto', a, b, undefined, 400],
  ]) {
    test(`transferencia rechaza ${label}`, async () => {
      await post('transferencia', { cuentaOrigenId: source, cuentaDestinoId: destination, monto }).expect(status);
      assert.equal(await balance(a), 10000); assert.equal(await balance(b), 20000);
      assert.equal(await Transaction.countDocuments(), 0);
    });
  }
  test('historial contiene tres tipos y orden descendente estable', async () => {
    await post('deposito', { cuentaId: a, monto: 1 }).expect(200);
    await post('retiro', { cuentaId: a, monto: 1 }).expect(200);
    await post('transferencia', { cuentaOrigenId: a, cuentaDestinoId: b, monto: 1 }).expect(200);
    const rows = (await request(app).get(`/api/cuenta/${a}/historial`).expect(200)).body.data;
    assert.deepEqual(rows.map((t) => t.type), ['TRANSFER', 'WITHDRAWAL', 'DEPOSIT']);
    assert.ok(rows.every((t, i) => !i || new Date(t.createdAt) <= new Date(rows[i - 1].createdAt)));
  });
  test('historial vacío y cuenta inexistente', async () => {
    assert.deepEqual((await request(app).get(`/api/cuenta/${a}/historial`).expect(200)).body.data, []);
    await request(app).get(`/api/cuenta/${missing}/historial`).expect(404);
  });
  test('retiros concurrentes nunca sobregiran', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => post('retiro', { cuentaId: a, monto: 10 })));
    assert.equal(results.filter((r) => r.status === 200).length, 10);
    assert.equal(results.filter((r) => r.status === 400).length, 10);
    assert.equal(await balance(a), 0); assert.equal(await Transaction.countDocuments(), 10);
  });
  test('transferencias concurrentes conservan fondos y rechazan sobregiro', async () => {
    const results = await Promise.all(Array.from({ length: 15 }, () => post('transferencia', { cuentaOrigenId: a, cuentaDestinoId: b, monto: 10 })));
    assert.equal(results.filter((r) => r.status === 200).length, 10);
    assert.equal(results.filter((r) => r.status === 400).length, 5);
    assert.equal(await balance(a), 0); assert.equal(await balance(b), 30000);
  });
  test('overflow destino revierte débito de transferencia', async () => {
    await Account.updateOne({ accountNumber: b }, { $set: { balance: MAX_CENTS } });
    await post('transferencia', { cuentaOrigenId: a, cuentaDestinoId: b, monto: 0.01 }).expect(400);
    assert.equal(await balance(a), 10000); assert.equal(await balance(b), MAX_CENTS);
    assert.equal(await Transaction.countDocuments(), 0);
  });
  test('overflow depósito se rechaza', async () => {
    await Account.updateOne({ accountNumber: a }, { $set: { balance: MAX_CENTS } });
    await post('deposito', { cuentaId: a, monto: 0.01 }).expect(400); assert.equal(await balance(a), MAX_CENTS);
  });
  for (const operation of ['deposito', 'retiro', 'transferencia']) {
    test(`fallo de historial en ${operation} revierte todos los saldos`, async (t) => {
      t.mock.method(Transaction, 'create', async () => { throw Error('Fallo controlado de historial'); });
      const body = operation === 'transferencia' ? { cuentaOrigenId: a, cuentaDestinoId: b, monto: 1 } : { cuentaId: a, monto: 1 };
      const response = await post(operation, body).expect(500);
      assert.equal(response.body.error.code, 'INTERNAL_ERROR'); assert.equal(response.body.error.stack, undefined);
      assert.equal(await balance(a), 10000); assert.equal(await balance(b), 20000);
      assert.equal(await Transaction.countDocuments(), 0);
    });
  }
  test('fallo de compensación bloquea nuevas operaciones standalone', async (t) => {
    if (database.transactions) { t.skip('Solo aplica al modo standalone; rollback transaccional probado por separado.'); return; }
    t.mock.method(Transaction, 'create', async () => { throw Error('Fallo controlado'); });
    t.mock.method(Account, 'updateOne', async () => { throw Error('Fallo compensación'); });
    await post('retiro', { cuentaId: a, monto: 1 }).expect(500);
    assert.equal(database.halted, true);
    await post('deposito', { cuentaId: a, monto: 1 }).expect(503);
    await request(app).get('/api/health').expect(503);
  });
  test('resultado incierto de red bloquea standalone sin compensar a ciegas', async (t) => {
    if (database.transactions) { t.skip('Solo aplica al modo standalone.'); return; }
    t.mock.method(Transaction, 'create', async () => { throw Object.assign(Error('red'), { name: 'MongoNetworkError' }); });
    await post('retiro', { cuentaId: a, monto: 1 }).expect(500);
    assert.equal(database.halted, true); assert.equal(await balance(a), 9900);
    await post('retiro', { cuentaId: a, monto: 1 }).expect(503);
  });
  test('JSON malformado y campos/operadores extra son 400', async () => {
    await request(app).post('/api/cuenta/deposito').set('Content-Type', 'application/json').send('{').expect(400);
    await post('deposito', { cuentaId: { $ne: null }, monto: 1 }).expect(400);
    await post('deposito', { cuentaId: a, monto: 1, balance: 999 }).expect(400);
  });
  test('cuerpo excesivo 413 y ruta desconocida 404', async () => {
    await post('deposito', { text: 'x'.repeat(11000) }).expect(413);
    await request(app).get('/api/missing').expect(404);
  });
  test('CORS restringido al frontend local', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://example.com');
    assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
  });
  test('modelos rechazan centavos fraccionarios, saldo negativo y participantes inválidos', async () => {
    for (const value of [-1, 0.5, NaN, Infinity]) await assert.rejects(new Account({ accountNumber: a, holderName: 'Luis', balance: value }).validate());
    await assert.rejects(new Transaction({ type: 'TRANSFER', amount: 100 }).validate());
    await assert.rejects(new Account({ accountNumber: a, holderName: ' ', balance: 0 }).validate());
    await assert.rejects(Account.create({ accountNumber: a, holderName: 'Duplicado', balance: 0 }), { code: 11000 });
  });
});
