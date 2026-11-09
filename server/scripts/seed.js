import { config } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { Account } from "../src/models/Account.js";
import { Transaction } from "../src/models/Transaction.js";
import mongoose from "mongoose";
try {
  await connectDatabase(config.mongoUri);
  if (mongoose.connection.name !== "cuenta_bancaria")
    throw new Error("El seed solo admite la base dedicada cuenta_bancaria.");
  await Promise.all([Account.init(), Transaction.init()]);
  await Transaction.deleteMany({});
  await Account.deleteMany({});
  const accounts = await Account.create([
    { accountNumber: "001-000001", holderName: "Luis", balance: 250000 },
    { accountNumber: "001-000002", holderName: "Ana", balance: 180000 },
    { accountNumber: "001-000003", holderName: "Carlos", balance: 90000 },
  ]);
  // Opening deposits explain the entire initial balance.
  await Transaction.create(
    accounts.map((account, index) => ({
      type: "DEPOSIT",
      amount: account.balance,
      destinationAccount: account._id,
      createdAt: new Date(Date.now() - (3 - index) * 60000),
    })),
  );
  console.table(
    accounts.map((a) => ({
      cuenta: a.accountNumber,
      titular: a.holderName,
      soles: (a.balance / 100).toFixed(2),
    })),
  );
} catch (error) {
  console.error("Seed falló:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
