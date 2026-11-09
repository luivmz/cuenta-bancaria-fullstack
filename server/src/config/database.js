import mongoose from "mongoose";
export const database = { transactions: false, halted: false };
export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  database.transactions = Boolean(hello.setName || hello.msg === "isdbgrid");
  database.halted = false;
  return database.transactions ? "transaction" : "compensating-single-process";
}
export const disconnectDatabase = () => mongoose.disconnect();
