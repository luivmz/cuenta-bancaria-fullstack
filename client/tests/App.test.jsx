import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, within, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App.jsx';
import * as api from '../src/services/api.js';
vi.mock('../src/services/api.js');
let accounts; let history;
const account = (id, holderName, balanceCents) => ({ id, accountNumber: id, holderName, balanceCents, balance: balanceCents / 100, currency: 'PEN' });
const participant = (id) => ({ accountNumber: id, holderName: accounts[id].holderName });
function movement(type, cents, source, destination) {
  const transaction = { id: String(Date.now()) + Math.random(), type, amountCents: cents, amount: cents / 100, sourceAccount: source ? participant(source) : null, destinationAccount: destination ? participant(destination) : null, createdAt: new Date().toISOString() };
  for (const id of [source, destination].filter(Boolean)) history[id].unshift(transaction);
}
beforeEach(() => {
  vi.resetAllMocks();
  accounts = { '001-000001': account('001-000001', 'Luis', 250000), '001-000002': account('001-000002', 'Ana', 180000), '001-000003': account('001-000003', 'Carlos', 90000) };
  history = Object.fromEntries(Object.keys(accounts).map((id) => [id, []]));
  api.getAccount.mockImplementation(async (id) => ({ ...accounts[id] }));
  api.getHistory.mockImplementation(async (id) => [...history[id]]);
  api.deposit.mockImplementation(async (id, amount) => { accounts[id].balanceCents += Math.round(amount * 100); movement('DEPOSIT', Math.round(amount * 100), null, id); });
  api.withdraw.mockImplementation(async (id, amount) => { accounts[id].balanceCents -= Math.round(amount * 100); movement('WITHDRAWAL', Math.round(amount * 100), id, null); });
  api.transfer.mockImplementation(async (source, destination, amount) => { accounts[source].balanceCents -= Math.round(amount * 100); accounts[destination].balanceCents += Math.round(amount * 100); movement('TRANSFER', Math.round(amount * 100), source, destination); });
});
async function ready() {
  render(<App />);
  await waitFor(() => expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,500.00'));
  return userEvent.setup();
}
const form = (name) => within(screen.getByRole('form', { name }));
describe('Interfaz bancaria y sincronización de estado', () => {
  test('carga saldo, props, cuenta y estado vacío', async () => {
    await ready();
    expect(screen.getByText('Aún no hay movimientos')).toBeInTheDocument();
    expect(screen.getByLabelText('Cuenta seleccionada')).toHaveValue('001-000001');
    expect(form('Depositar').getByLabelText('Monto (S/)')).toBeEnabled();
  });
  test('muestra loading y deshabilita formularios', async () => {
    api.getAccount.mockImplementation(() => new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Depositar fondos' })).toBeDisabled();
  });
  test('depósito actualiza saldo e historial y limpia input sin recarga', async () => {
    const user = await ready(); const deposit = form('Depositar');
    await user.type(deposit.getByLabelText('Monto (S/)'), '15.90');
    await user.click(deposit.getByRole('button'));
    expect(await screen.findByText('Depósito realizado correctamente.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,515.90');
    expect(screen.getByText('Depósito', { exact: true })).toBeInTheDocument();
    expect(deposit.getByLabelText('Monto (S/)')).toHaveValue(null);
    expect(api.getAccount).toHaveBeenCalledTimes(2); expect(api.getHistory).toHaveBeenCalledTimes(2);
  });
  test('retiro actualiza saldo e historial', async () => {
    const user = await ready(); const withdraw = form('Retirar');
    await user.type(withdraw.getByLabelText('Monto (S/)'), '100'); await user.click(withdraw.getByRole('button'));
    await screen.findByText('Retiro realizado correctamente.');
    expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,400.00');
    expect(screen.getByText('Retiro', { exact: true })).toBeInTheDocument();
  });
  test('transferencia actualiza origen y perspectiva de destino al cambiar cuenta', async () => {
    const user = await ready(); const transfer = form('Transferir');
    await user.type(transfer.getByLabelText('Monto (S/)'), '40');
    await user.selectOptions(transfer.getByLabelText('Cuenta de destino'), '001-000002'); await user.click(transfer.getByRole('button'));
    await screen.findByText('Transferencia realizada correctamente.');
    expect(screen.getByText('Transferencia enviada')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,460.00');
    await user.selectOptions(screen.getByLabelText('Cuenta seleccionada'), '001-000002');
    expect(await screen.findByText('Transferencia recibida')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('1,840.00');
  });
  for (const amount of ['', '0', '-1', '1.001']) {
    test(`valida monto inválido ${amount || 'vacío'} antes de llamar API`, async () => {
      const user = await ready(); const deposit = form('Depositar');
      if (amount) await user.type(deposit.getByLabelText('Monto (S/)'), amount);
      await user.click(deposit.getByRole('button'));
      expect(deposit.getByRole('alert')).toBeInTheDocument(); expect(api.deposit).not.toHaveBeenCalled();
    });
  }
  test('transferencia exige destino y excluye origen', async () => {
    const user = await ready(); const transfer = form('Transferir');
    expect(within(transfer.getByLabelText('Cuenta de destino')).queryByRole('option', { name: /Luis/ })).not.toBeInTheDocument();
    await user.type(transfer.getByLabelText('Monto (S/)'), '1'); await user.click(transfer.getByRole('button'));
    expect(transfer.getByRole('alert')).toHaveTextContent('Selecciona otra cuenta'); expect(api.transfer).not.toHaveBeenCalled();
  });
  test('muestra error de negocio conservando monto e información previa', async () => {
    api.withdraw.mockRejectedValue(new Error('Saldo insuficiente.'));
    const user = await ready(); const withdraw = form('Retirar');
    await user.type(withdraw.getByLabelText('Monto (S/)'), '9999'); await user.click(withdraw.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saldo insuficiente.');
    expect(withdraw.getByLabelText('Monto (S/)')).toHaveValue(9999);
    expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,500.00');
  });
  test('bloquea doble envío, formularios y selección durante operación', async () => {
    let finish;
    api.deposit.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const user = await ready(); const deposit = form('Depositar');
    await user.type(deposit.getByLabelText('Monto (S/)'), '1');
    fireEvent.submit(screen.getByRole('form', { name: 'Depositar' }));
    fireEvent.submit(screen.getByRole('form', { name: 'Depositar' }));
    expect(api.deposit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retirar fondos' })).toBeDisabled();
    expect(screen.getByLabelText('Cuenta seleccionada')).toBeDisabled();
    finish(); await screen.findByText('Depósito realizado correctamente.');
  });
  test('error de carga y recuperación con Actualizar', async () => {
    api.getAccount.mockRejectedValueOnce(new Error('API no disponible.'));
    const user = userEvent.setup(); render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('API no disponible.');
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('2,500.00'));
  });
  test('si falla refresco después de éxito informa operación aplicada', async () => {
    const user = await ready();
    api.getHistory.mockRejectedValueOnce(new Error('Error de lectura.'));
    const deposit = form('Depositar'); await user.type(deposit.getByLabelText('Monto (S/)'), '1'); await user.click(deposit.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent('La operación se realizó');
    expect(api.deposit).toHaveBeenCalledTimes(1);
    expect(deposit.getByRole('button')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(deposit.getByRole('button')).toBeEnabled());
  });
  test('el cambio de cuenta descarta formulario anterior', async () => {
    const user = await ready();
    await user.type(form('Depositar').getByLabelText('Monto (S/)'), '12');
    await user.selectOptions(screen.getByLabelText('Cuenta seleccionada'), '001-000003');
    await waitFor(() => expect(screen.getByRole('region', { name: 'Resumen de saldo' })).toHaveTextContent('900.00'));
    expect(form('Depositar').getByLabelText('Monto (S/)')).toHaveValue(null);
  });
  test('formulario se puede completar por teclado y tiene labels', async () => {
    const user = await ready(); const input = form('Depositar').getByLabelText('Monto (S/)'); input.focus();
    await user.keyboard('1'); await user.tab(); expect(form('Depositar').getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}'); await screen.findByText('Depósito realizado correctamente.');
  });
});
