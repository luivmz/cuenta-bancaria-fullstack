import * as bank from '../services/banking.js';
import { bodyFields } from '../utils/money.js';
export const account = async (req, res) => res.json({ data: await bank.getAccount(req.params.id) });
export const history = async (req, res) => res.json({ data: await bank.getHistory(req.params.id) });
export const deposit = async (req, res) => {
  bodyFields(req.body, ['cuentaId', 'monto']);
  res.json({ data: await bank.deposit(req.body.cuentaId, req.body.monto) });
};
export const withdraw = async (req, res) => {
  bodyFields(req.body, ['cuentaId', 'monto']);
  res.json({ data: await bank.withdraw(req.body.cuentaId, req.body.monto) });
};
export const transfer = async (req, res) => {
  bodyFields(req.body, ['cuentaOrigenId', 'cuentaDestinoId', 'monto']);
  res.json({ data: await bank.transfer(req.body.cuentaOrigenId, req.body.cuentaDestinoId, req.body.monto) });
};
