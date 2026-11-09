import mongoose from "mongoose";
import { Account } from "../models/Account.js";
import { Transaction } from "../models/Transaction.js";
import { database } from "../config/database.js";
import { AppError, invalid, notFound } from "../utils/errors.js";
import { accountId, toCents, MAX_CENTS } from "../utils/money.js";
import { serializeAccount, serializeTransaction } from "../utils/serialize.js";
import { createMutex } from "../utils/mutex.js";
const exclusive = createMutex();
const participants = "accountNumber holderName";
const read = (task) => (database.transactions ? task() : exclusive(task));
async function findAccount(id, session) {
  const account = await Account.findOne({ accountNumber: id }).session(
    session || null,
  );
  if (!account) throw notFound();
  return account;
}
export const getAccount = (id) => {
  accountId(id);
  return read(async () => serializeAccount(await findAccount(id)));
};
export const getHistory = (id) => {
  accountId(id);
  return read(async () => {
    const account = await findAccount(id);
    const rows = await Transaction.find({
      $or: [
        { sourceAccount: account._id },
        { destinationAccount: account._id },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .populate("sourceAccount destinationAccount", participants);
    return rows.map(serializeTransaction);
  });
};

// Network/write-concern failures can have an unknown outcome. Never blindly retry/compensate them.
function uncertain(error) {
  return (
    /Mongo(Network|ServerSelection|WriteConcern)/.test(error.name || "") ||
    error.writeConcernError ||
    error.code === 64 ||
    error.hasErrorLabel?.("UnknownTransactionCommitResult")
  );
}
function halt(error) {
  database.halted = true;
  console.error(
    "CONSISTENCY_REVIEW_REQUIRED: mutaciones bloqueadas; revisar saldos e historial antes de reiniciar.",
    error.name,
  );
}
async function mutate(work) {
  if (database.transactions) {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(() => work(session, []));
    } finally {
      await session.endSession();
    }
  }
  return exclusive(async () => {
    if (database.halted)
      throw new AppError(
        503,
        "CONSISTENCY_REVIEW_REQUIRED",
        "Operaciones bloqueadas: se requiere revisar la consistencia de los datos.",
      );
    const undo = [];
    try {
      return await work(null, undo);
    } catch (error) {
      if (uncertain(error)) halt(error);
      else {
        try {
          for (const compensate of undo.reverse()) await compensate();
        } catch (compensationError) {
          halt(compensationError);
        }
      }
      throw error;
    }
  });
}
async function changeBalance(account, cents, session, undo) {
  const filter = {
    _id: account._id,
    balance: cents < 0 ? { $gte: -cents } : { $lte: MAX_CENTS - cents },
  };
  const updated = await Account.findOneAndUpdate(
    filter,
    { $inc: { balance: cents } },
    { new: true, session },
  );
  if (!updated)
    throw invalid(
      cents < 0
        ? "Saldo insuficiente."
        : "El saldo resultante excede el límite permitido.",
    );
  if (!session)
    undo.push(async () => {
      const result = await Account.updateOne(
        { _id: account._id, balance: updated.balance },
        { $inc: { balance: -cents } },
      );
      if (result.modifiedCount !== 1)
        throw new Error("Compensación no confirmada");
    });
  return updated;
}
async function record(type, amount, source, destination, session) {
  const [transaction] = await Transaction.create(
    [
      {
        type,
        amount,
        sourceAccount: source?._id || null,
        destinationAccount: destination?._id || null,
      },
    ],
    { session },
  );
  // Serialize from known participants: no fallible DB read after inserting the movement.
  return serializeTransaction({
    _id: transaction._id,
    type,
    amount,
    createdAt: transaction.createdAt,
    sourceAccount: source,
    destinationAccount: destination,
  });
}
export function deposit(id, amount) {
  accountId(id);
  const cents = toCents(amount);
  return mutate(async (session, undo) => {
    const account = await findAccount(id, session);
    const updated = await changeBalance(account, cents, session, undo);
    const transaction = await record("DEPOSIT", cents, null, account, session);
    return { account: serializeAccount(updated), transaction };
  });
}
export function withdraw(id, amount) {
  accountId(id);
  const cents = toCents(amount);
  return mutate(async (session, undo) => {
    const account = await findAccount(id, session);
    const updated = await changeBalance(account, -cents, session, undo);
    const transaction = await record(
      "WITHDRAWAL",
      cents,
      account,
      null,
      session,
    );
    return { account: serializeAccount(updated), transaction };
  });
}
export function transfer(sourceId, destinationId, amount) {
  accountId(sourceId);
  accountId(destinationId);
  const cents = toCents(amount);
  if (sourceId === destinationId)
    throw invalid("Selecciona una cuenta de destino diferente del origen.");
  return mutate(async (session, undo) => {
    const source = await findAccount(sourceId, session);
    const destination = await findAccount(destinationId, session);
    const updatedSource = await changeBalance(source, -cents, session, undo);
    const updatedDestination = await changeBalance(
      destination,
      cents,
      session,
      undo,
    );
    const transaction = await record(
      "TRANSFER",
      cents,
      source,
      destination,
      session,
    );
    return {
      sourceAccount: serializeAccount(updatedSource),
      destinationAccount: serializeAccount(updatedDestination),
      transaction,
    };
  });
}
