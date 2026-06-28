import test from "node:test";
import assert from "node:assert/strict";

import { authController } from "../controllers/auth.controller.js";
import { authService } from "../services/auth.service.js";
import { HttpError } from "../utils/httpError.js";

test("authController.login inicia sesion para cuenta de comercio", async (t) => {
  const originalAuthenticate = authService.authenticate;
  const originalUpdateLastLogin = authService.updateLastLogin;

  t.after(() => {
    authService.authenticate = originalAuthenticate;
    authService.updateLastLogin = originalUpdateLastLogin;
  });

  authService.authenticate = async ({ email, password }) => {
    assert.equal(email, "cliente@demo.com");
    assert.equal(password, "supersecret");

    return {
      _id: "acc-1",
      id: "pub-1",
      email,
      role: "COMMERCE_ADMIN",
      comercioId: "com-1"
    };
  };

  authService.updateLastLogin = async (accountId) => ({
    _id: accountId,
    id: "pub-1",
    email: "cliente@demo.com",
    role: "COMMERCE_ADMIN",
    comercioId: "com-1"
  });

  const req = {
    body: { email: "cliente@demo.com", password: "supersecret" },
    session: {
      save(callback) {
        callback(null);
      }
    }
  };
  const res = createResponseDouble();

  await authController.login(req, res, failOnNext);

  assert.deepEqual(req.session.auth, {
    accountId: "acc-1",
    id: "pub-1",
    email: "cliente@demo.com",
    role: "COMMERCE_ADMIN",
    comercioId: "com-1",
    tiendaId: null
  });
  assert.equal(res.redirectPath, "/");
});

test("authController.login rechaza cuentas de plataforma en login de comercio", async (t) => {
  const originalAuthenticate = authService.authenticate;

  t.after(() => {
    authService.authenticate = originalAuthenticate;
  });

  authService.authenticate = async () => ({
    _id: "acc-2",
    id: "pub-2",
    email: "admin@demo.com",
    role: "PLATFORM_ADMIN",
    comercioId: null
  });

  const req = {
    body: { email: "admin@demo.com", password: "supersecret" },
    session: {}
  };
  const res = createResponseDouble();

  await authController.login(req, res, failOnNext);

  assert.equal(res.statusCodeValue, 401);
  assert.equal(res.renderView, "auth/login");
  assert.equal(res.renderPayload.errorMessage, "Credenciales invalidas.");
});

test("authController.login re-renderiza con error seguro para credenciales invalidas", async (t) => {
  const originalAuthenticate = authService.authenticate;

  t.after(() => {
    authService.authenticate = originalAuthenticate;
  });

  authService.authenticate = async () => {
    throw new HttpError(401, "AUTH_INVALID", "Credenciales invalidas.");
  };

  const req = {
    body: { email: "cliente@demo.com", password: "badpass" },
    session: {}
  };
  const res = createResponseDouble();

  await authController.login(req, res, failOnNext);

  assert.equal(res.statusCodeValue, 401);
  assert.equal(res.renderView, "auth/login");
  assert.equal(res.renderPayload.errorMessage, "Credenciales invalidas.");
});

function createResponseDouble() {
  return {
    statusCodeValue: 200,
    renderView: null,
    renderPayload: null,
    redirectPath: null,
    status(code) {
      this.statusCodeValue = code;
      return this;
    },
    render(view, payload) {
      this.renderView = view;
      this.renderPayload = payload;
      return this;
    },
    redirect(path) {
      this.redirectPath = path;
      return this;
    }
  };
}

function failOnNext(error) {
  throw error || new Error("next no deberia ser llamado");
}
