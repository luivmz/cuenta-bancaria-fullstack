import mongoose from 'mongoose';
import { MAX_CENTS } from '../utils/money.js';
const accountSchema = new mongoose.Schema({
  accountNumber: { type: String, required: true, unique: true, immutable: true, match: /^\d{3}-\d{6}$/ },
  holderName: { type: String, required: true, trim: true, maxlength: 120 },
  balance: { type: Number, required: true, min: 0, max: MAX_CENTS, validate: Number.isSafeInteger },
}, { timestamps: true, versionKey: false });
export const Account = mongoose.model('Account', accountSchema);
