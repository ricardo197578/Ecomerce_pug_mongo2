import test from "node:test";
import assert from "node:assert/strict";

import { conciliacionService } from "../services/conciliacion.service.js";
import { estadisticaService } from "../services/estadistica.service.js";
import { usuarioService } from "../services/usuario.service.js";
import { tiendaService } from "../services/tienda.service.js";
import { comercioRepository } from "../repositories/comercio.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";

const commerceAuthContext = {
  accountId: "acc-1",
  role: "COMMERCE_ADMIN",
  comercioId: "com-1",
  tiendaId: null,
  isAuthenticated: true,
  isPlatformAdmin: false,
  isCommerceActor: true,
  isCommerceAdmin: true,
  isCommerceUser: false
};

const commerceUserAuthContext = {
  accountId: "acc-2",
  role: "COMMERCE_USER",
  comercioId: "com-1",
  tiendaId: "tienda-1",
  isAuthenticated: true,
  isPlatformAdmin: false,
  isCommerceActor: true,
  isCommerceAdmin: false,
  isCommerceUser: true
};

test("tiendaService.getById bloquea acceso a tiendas de otro comercio", async (t) => {
  const originalFindById = tiendaRepository.findById;

  t.after(() => {
    tiendaRepository.findById = originalFindById;
  });

  tiendaRepository.findById = async () => ({
    _id: "tienda-2",
    comercioId: "com-2",
    nombre: "Tienda ajena"
  });

  await assert.rejects(
    () => tiendaService.getById("tienda-2", commerceAuthContext),
    (error) => error.statusCode === 404
  );
});

test("conciliacionService.conciliar filtra transacciones y pagos por tenant", async (t) => {
  const originalFindAllTransacciones = transaccionRepository.findAll;
  const originalFindAllPagos = pagoRepository.findAll;

  t.after(() => {
    transaccionRepository.findAll = originalFindAllTransacciones;
    pagoRepository.findAll = originalFindAllPagos;
  });

  transaccionRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1" });
    return [{ _id: "tx-1", id: "pub-tx-1", comercioId: "com-1", estado: "PENDIENTE", monto: 100, moneda: "ARS" }];
  };
  pagoRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1" });
    return [{ _id: "p-1", id: "p-1", transaccionId: "tx-1", comercioId: "com-1", estado: "PENDIENTE", monto: 100, moneda: "ARS" }];
  };

  const report = await conciliacionService.conciliar(commerceAuthContext);

  assert.equal(report.resumen.transaccionesAnalizadas, 1);
  assert.equal(report.resumen.pagosAnalizados, 1);
  assert.equal(report.resumen.totalInconsistencias, 0);
});

test("conciliacionService.conciliar filtra tambien por tienda para COMMERCE_USER", async (t) => {
  const originalFindAllTransacciones = transaccionRepository.findAll;
  const originalFindAllPagos = pagoRepository.findAll;

  t.after(() => {
    transaccionRepository.findAll = originalFindAllTransacciones;
    pagoRepository.findAll = originalFindAllPagos;
  });

  transaccionRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1", tiendaId: "tienda-1" });
    return [];
  };
  pagoRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1", tiendaId: "tienda-1" });
    return [];
  };

  const report = await conciliacionService.conciliar(commerceUserAuthContext);
  assert.equal(report.resumen.transaccionesAnalizadas, 0);
});

test("estadisticaService.getHotSaleReport devuelve solo datos del comercio autenticado", async (t) => {
  const originalFindAllTransacciones = transaccionRepository.findAll;
  const originalFindAllPagos = pagoRepository.findAll;
  const originalFindByIdComercio = comercioRepository.findById;

  t.after(() => {
    transaccionRepository.findAll = originalFindAllTransacciones;
    pagoRepository.findAll = originalFindAllPagos;
    comercioRepository.findById = originalFindByIdComercio;
  });

  transaccionRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1" });
    return [
      { _id: "tx-1", comercioId: "com-1", monto: 100, moneda: "ARS", estado: "APROBADA" },
      { _id: "tx-2", comercioId: "com-1", monto: 50, moneda: "ARS", estado: "PENDIENTE" }
    ];
  };
  pagoRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1" });
    return [
      { _id: "p-1", comercioId: "com-1", monto: 100, moneda: "ARS", estado: "APROBADO" },
      { _id: "p-2", comercioId: "com-1", monto: 50, moneda: "ARS", estado: "RECHAZADO" }
    ];
  };
  comercioRepository.findById = async (id) => ({ _id: id, nombre: "Comercio Uno" });

  const report = await estadisticaService.getHotSaleReport(commerceAuthContext);

  assert.equal(report.summary.totalTransacciones, 2);
  assert.equal(report.summary.totalPagos, 2);
  assert.equal(report.summary.gmvTotal, 150);
  assert.equal(report.topComerciosPorVolumen.length, 1);
  assert.equal(report.topComerciosPorVolumen[0].comercioNombre, "Comercio Uno");
});

test("tiendaService.getAll limita a la tienda asignada para COMMERCE_USER", async (t) => {
  const originalFindAll = tiendaRepository.findAll;

  t.after(() => {
    tiendaRepository.findAll = originalFindAll;
  });

  tiendaRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1", _id: "tienda-1" });
    return [{ _id: "tienda-1", comercioId: "com-1", nombre: "Sucursal Centro" }];
  };

  const items = await tiendaService.getAll(commerceUserAuthContext);
  assert.equal(items.length, 1);
});

test("tiendaService.create bloquea a COMMERCE_USER", async () => {
  await assert.rejects(
    () => tiendaService.create({ comercioId: "com-1", nombre: "Nueva" }, commerceUserAuthContext),
    (error) => error.statusCode === 403
  );
});

test("usuarioService.getAll limita usuarios a la tienda del COMMERCE_USER", async (t) => {
  const originalFindAll = usuarioRepository.findAll;

  t.after(() => {
    usuarioRepository.findAll = originalFindAll;
  });

  usuarioRepository.findAll = async (filter = {}) => {
    assert.deepEqual(filter, { comercioId: "com-1", tiendaId: "tienda-1" });
    return [{ _id: "u-1", comercioId: "com-1", tiendaId: "tienda-1", nombre: "Ana", email: "ana@demo.local" }];
  };

  const items = await usuarioService.getAll(commerceUserAuthContext);
  assert.equal(items.length, 1);
});
