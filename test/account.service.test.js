import test from "node:test";
import assert from "node:assert/strict";

import { accountService } from "../services/account.service.js";
import { accountRepository } from "../repositories/account.repository.js";
import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { authService } from "../services/auth.service.js";

test("accountService.create crea una cuenta de comercio desde plataforma", async (t) => {
  const originalFindByIdComercio = comercioRepository.findById;
  const originalFindByIdTienda = tiendaRepository.findById;
  const originalHashPassword = authService.hashPassword;
  const originalCreate = accountRepository.create;

  t.after(() => {
    comercioRepository.findById = originalFindByIdComercio;
    tiendaRepository.findById = originalFindByIdTienda;
    authService.hashPassword = originalHashPassword;
    accountRepository.create = originalCreate;
  });

  comercioRepository.findById = async (id) => ({ _id: id, nombre: "Centro Hogar" });
  tiendaRepository.findById = async () => null;
  authService.hashPassword = async (password) => `hash:${password}`;
  accountRepository.create = async (data) => ({ _id: "acc-1", id: "pub-1", ...data });

  const created = await accountService.create({
    email: "nuevo@demo.local",
    password: "Password2026",
    role: "COMMERCE_ADMIN",
    comercioId: "com-1",
    activo: "on"
  });

  assert.equal(created.email, "nuevo@demo.local");
  assert.equal(created.role, "COMMERCE_ADMIN");
  assert.equal(created.comercioId, "com-1");
  assert.equal(created.tiendaId, null);
  assert.equal(created.activo, true);
});

test("accountService.create exige tienda para COMMERCE_USER", async (t) => {
  const originalFindByIdComercio = comercioRepository.findById;

  t.after(() => {
    comercioRepository.findById = originalFindByIdComercio;
  });

  comercioRepository.findById = async (id) => ({ _id: id, nombre: "Centro Hogar" });

  await assert.rejects(
    () => accountService.create({
      email: "user@demo.local",
      password: "Password2026",
      role: "COMMERCE_USER",
      comercioId: "com-1",
      activo: true
    }),
    (error) => error.statusCode === 400
  );
});

test("accountService.create rechaza roles no permitidos para comercios", async () => {
  await assert.rejects(
    () => accountService.create({
      email: "bad@demo.local",
      password: "Password2026",
      role: "PLATFORM_ADMIN",
      comercioId: "com-1",
      activo: true
    }),
    (error) => error.statusCode === 400
  );
});

test("accountService.update permite cambiar email sin cambiar contrasena", async (t) => {
  const originalFindByIdAccount = accountRepository.findById;
  const originalFindByIdComercio = comercioRepository.findById;
  const originalFindByIdTienda = tiendaRepository.findById;
  const originalUpdate = accountRepository.update;
  const originalHashPassword = authService.hashPassword;

  t.after(() => {
    accountRepository.findById = originalFindByIdAccount;
    comercioRepository.findById = originalFindByIdComercio;
    tiendaRepository.findById = originalFindByIdTienda;
    accountRepository.update = originalUpdate;
    authService.hashPassword = originalHashPassword;
  });

  accountRepository.findById = async () => ({
    _id: "acc-1",
    id: "pub-1",
    email: "viejo@demo.local",
    role: "COMMERCE_ADMIN",
    comercioId: "com-1",
    tiendaId: null,
    activo: true,
    passwordHash: "hash:old"
  });
  comercioRepository.findById = async (id) => ({ _id: id, nombre: "Centro Hogar" });
  tiendaRepository.findById = async (id) => ({ _id: id, comercioId: "com-1", nombre: "Sucursal Centro" });
  authService.hashPassword = async () => {
    throw new Error("no deberia rehacer hash sin password");
  };
  accountRepository.update = async (_id, fields) => ({ _id: "acc-1", id: "pub-1", ...fields, lastLoginAt: null });

  const updated = await accountService.update("acc-1", {
    email: "nuevo@demo.local",
    role: "COMMERCE_USER",
    comercioId: "com-1",
    tiendaId: "tienda-1",
    activo: true
  });

  assert.equal(updated.email, "nuevo@demo.local");
  assert.equal(updated.role, "COMMERCE_USER");
  assert.equal(updated.tiendaId, "tienda-1");
});
