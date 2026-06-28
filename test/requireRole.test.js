import test from "node:test";
import assert from "node:assert/strict";

import { requireRole } from "../middlewares/requireRole.js";

test("requireRole permite acceso al rol autorizado", async () => {
  const middleware = requireRole(["COMMERCE_ADMIN"]);
  const req = {
    session: {
      auth: {
        accountId: "acc-1",
        role: "COMMERCE_ADMIN"
      }
    },
    originalUrl: "/tiendas"
  };
  const res = createResponseDouble();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.renderView, null);
});

test("requireRole responde 403 JSON en API cuando el rol no coincide", async () => {
  const middleware = requireRole(["PLATFORM_ADMIN"]);
  const req = {
    session: {
      auth: {
        accountId: "acc-2",
        role: "COMMERCE_USER"
      }
    },
    originalUrl: "/api/reportes/facturacion"
  };
  const res = createResponseDouble();

  await middleware(req, res, () => {
    throw new Error("next no deberia ejecutarse");
  });

  assert.equal(res.statusCodeValue, 403);
  assert.deepEqual(res.jsonPayload, {
    success: false,
    error: {
      code: "FORBIDDEN",
      message: "No tenes permisos para acceder a este recurso."
    }
  });
});

test("requireRole renderiza error 403 en HTML cuando el rol no coincide", async () => {
  const middleware = requireRole(["PLATFORM_ADMIN"]);
  const req = {
    session: {
      auth: {
        accountId: "acc-3",
        role: "COMMERCE_USER"
      }
    },
    originalUrl: "/suscripciones"
  };
  const res = createResponseDouble();

  await middleware(req, res, () => {
    throw new Error("next no deberia ejecutarse");
  });

  assert.equal(res.statusCodeValue, 403);
  assert.equal(res.renderView, "error");
  assert.equal(res.renderPayload.errorTitle, "FORBIDDEN");
});

function createResponseDouble() {
  return {
    statusCodeValue: 200,
    renderView: null,
    renderPayload: null,
    jsonPayload: null,
    status(code) {
      this.statusCodeValue = code;
      return this;
    },
    render(view, payload) {
      this.renderView = view;
      this.renderPayload = payload;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    }
  };
}
