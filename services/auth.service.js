import bcrypt from "bcrypt";
import { appConfig } from "../config/config.js";
import { accountRepository } from "../repositories/account.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

const VALID_ROLES = new Set(["PLATFORM_ADMIN", "COMMERCE_ADMIN", "COMMERCE_USER"]);

export const authService = {
  async createAccount(payload) {
    const normalized = normalizeAccountPayload(payload);
    validateAccountPayload(normalized);

    if (requiresComercioId(normalized.role) && !normalized.comercioId) {
      throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio para este rol.");
    }

    if (normalized.role === "COMMERCE_USER") {
      if (!normalized.tiendaId) {
        throw new HttpError(400, "VALIDATION_ERROR", "La tienda es obligatoria para COMMERCE_USER.");
      }

      const tienda = await tiendaRepository.findById(normalized.tiendaId);
      if (!tienda || String(tienda.comercioId) !== String(normalized.comercioId)) {
        throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda no pertenece al comercio indicado.");
      }
    }

    if (normalized.role === "PLATFORM_ADMIN") {
      normalized.comercioId = null;
      normalized.tiendaId = null;
    }

    if (normalized.role === "COMMERCE_ADMIN") {
      normalized.tiendaId = null;
    }

    const passwordHash = await hashPassword(normalized.password);

    try {
      return await accountRepository.create({
        email: normalized.email,
        passwordHash,
        role: normalized.role,
        comercioId: normalized.comercioId,
        tiendaId: normalized.tiendaId,
        activo: normalized.activo,
        lastLoginAt: null
      });
    } catch (error) {
      handleMongoUnique(error, "Ya existe una cuenta con ese email.");
    }
  },

  async authenticate(payload) {
    const credentials = normalizeCredentials(payload);
    validateCredentials(credentials);

    const account = await accountRepository.findByEmail(credentials.email);
    if (!account || !account.activo) {
      throw new HttpError(401, "AUTH_INVALID", "Credenciales invalidas.");
    }

    const isValidPassword = await bcrypt.compare(credentials.password, account.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, "AUTH_INVALID", "Credenciales invalidas.");
    }

    return buildSafeIdentity(account);
  },

  async updateLastLogin(accountId) {
    const updated = await accountRepository.update(accountId, { lastLoginAt: new Date() });
    if (!updated) {
      throw new HttpError(404, "NOT_FOUND", "Cuenta no encontrada.");
    }
    return buildSafeIdentity(updated);
  },

  async hashPassword(password) {
    return hashPassword(String(password || ""));
  },

  async verifyPassword(password, passwordHash) {
    if (!passwordHash) return false;
    return bcrypt.compare(String(password || ""), passwordHash);
  }
};

function normalizeAccountPayload(payload) {
  return {
    email: String(payload.email || "").trim().toLowerCase(),
    password: String(payload.password || "").trim(),
    role: String(payload.role || "").trim().toUpperCase(),
    comercioId: payload.comercioId ? String(payload.comercioId).trim() : null,
    tiendaId: payload.tiendaId ? String(payload.tiendaId).trim() : null,
    activo: payload.activo === undefined ? true : payload.activo === true || payload.activo === "true" || payload.activo === "on"
  };
}

function normalizeCredentials(payload) {
  return {
    email: String(payload.email || payload.user || "").trim().toLowerCase(),
    password: String(payload.password || "")
  };
}

function validateAccountPayload(payload) {
  if (!payload.email) throw new HttpError(400, "VALIDATION_ERROR", "El email es obligatorio.");
  if (!payload.password) throw new HttpError(400, "VALIDATION_ERROR", "La contrasena es obligatoria.");
  if (payload.password.length < 8) {
    throw new HttpError(400, "VALIDATION_ERROR", "La contrasena debe tener al menos 8 caracteres.");
  }
  if (!payload.role) throw new HttpError(400, "VALIDATION_ERROR", "El rol es obligatorio.");
  if (!VALID_ROLES.has(payload.role)) {
    throw new HttpError(400, "VALIDATION_ERROR", "El rol es invalido.");
  }
}

function validateCredentials(payload) {
  if (!payload.email || !payload.password) {
    throw new HttpError(400, "VALIDATION_ERROR", "Email y contrasena son obligatorios.");
  }
}

function requiresComercioId(role) {
  return role === "COMMERCE_ADMIN" || role === "COMMERCE_USER";
}

async function hashPassword(password) {
  if (!password) {
    throw new HttpError(400, "VALIDATION_ERROR", "La contrasena es obligatoria.");
  }
  return bcrypt.hash(password, appConfig.bcryptSaltRounds);
}

function buildSafeIdentity(account) {
  return {
    id: account.id,
    _id: account._id,
    email: account.email,
    role: account.role,
    comercioId: account.comercioId || null,
    tiendaId: account.tiendaId || null,
    activo: account.activo,
    lastLoginAt: account.lastLoginAt || null
  };
}
