import { createModel } from "./shared.js";

const ACCOUNT_ROLES = ["PLATFORM_ADMIN", "COMMERCE_ADMIN", "COMMERCE_USER"];

export const AccountModel = createModel("Account", {
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ACCOUNT_ROLES },
  comercioId: { type: String, trim: true, default: null },
  tiendaId: { type: String, trim: true, default: null },
  activo: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null }
});
