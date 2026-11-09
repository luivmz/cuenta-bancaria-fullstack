import { toSoles } from "./money.js";
export const serializeAccount = (account) => ({
  id: account.accountNumber,
  accountNumber: account.accountNumber,
  holderName: account.holderName,
  balance: toSoles(account.balance),
  balanceCents: account.balance,
  currency: "PEN",
});
const participant = (account) =>
  account
    ? {
        accountNumber: account.accountNumber,
        holderName: account.holderName,
      }
    : null;
export const serializeTransaction = (transaction) => ({
  id: String(transaction._id),
  type: transaction.type,
  amount: toSoles(transaction.amount),
  amountCents: transaction.amount,
  sourceAccount: participant(transaction.sourceAccount),
  destinationAccount: participant(transaction.destinationAccount),
  createdAt: transaction.createdAt,
});
