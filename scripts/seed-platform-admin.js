import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { accountRepository } from "../repositories/account.repository.js";
import { authService } from "../services/auth.service.js";

async function seedPlatformAdmin() {
  const email = String(process.env.SEED_PLATFORM_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.SEED_PLATFORM_ADMIN_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error("Defini SEED_PLATFORM_ADMIN_EMAIL y SEED_PLATFORM_ADMIN_PASSWORD antes de ejecutar el seed.");
  }

  await connectDatabase();

  const existing = await accountRepository.findByEmail(email);
  const passwordHash = await authService.hashPassword(password);

  if (existing) {
    await accountRepository.update(existing._id, {
      email,
      passwordHash,
      role: "PLATFORM_ADMIN",
      comercioId: null,
      activo: true
    });
    console.log(`Admin de plataforma actualizado: ${email}`);
    return;
  }

  await accountRepository.create({
    email,
    passwordHash,
    role: "PLATFORM_ADMIN",
    comercioId: null,
    activo: true,
    lastLoginAt: null
  });

  console.log(`Admin de plataforma creado: ${email}`);
}

seedPlatformAdmin()
  .catch((error) => {
    console.error("Error al ejecutar seed de admin de plataforma", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
