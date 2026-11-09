import mongoose from 'mongoose';
import { MAX_CENTS } from '../utils/money.js';
const transactionSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'] },
  amount: { type: Number, required: true, min: 1, max: MAX_CENTS, validate: Number.isSafeInteger },
  sourceAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  destinationAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
}, { timestamps: true, versionKey: false });
transactionSchema.pre('validate', function () {
  const source = Boolean(this.sourceAccount);
  const destination = Boolean(this.destinationAccount);
  if ((this.type === 'DEPOSIT' && (source || !destination)) ||
      (this.type === 'WITHDRAWAL' && (!source || destination)) ||
      (this.type === 'TRANSFER' && (!source || !destination || this.sourceAccount.equals(this.destinationAccount)))) {
    this.invalidate('type', 'Los participantes no corresponden al tipo de operación.');
  }
});
transactionSchema.index({ sourceAccount: 1, createdAt: -1, _id: -1 });
transactionSchema.index({ destinationAccount: 1, createdAt: -1, _id: -1 });
export const Transaction = mongoose.model('Transaction', transactionSchema);
