import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { accountController } from "../controllers/account.controller.js";
import { homeController } from "../controllers/home.controller.js";
import { buildCrudRoutes } from "./crud.routes.js";
import { comercioController } from "../controllers/comercio.controller.js";
import { tiendaController } from "../controllers/tienda.controller.js";
import { usuarioController } from "../controllers/usuario.controller.js";
import { transaccionController } from "../controllers/transaccion.controller.js";
import { pagoController } from "../controllers/pago.controller.js";
import { suscripcionController } from "../controllers/suscripcion.controller.js";
import { logisticaController } from "../controllers/logistica.controller.js";
import { conciliacionController } from "../controllers/conciliacion.controller.js";
import { estadisticaController } from "../controllers/estadistica.controller.js";
import { platformAuthController } from "../controllers/platformAuth.controller.js";
import { logisticaRepository } from "../repositories/logistica.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCommerceAdmin } from "../middlewares/requireCommerceAdmin.js";
import { requirePlatformAuth } from "../middlewares/requirePlatformAuth.js";
import { requireTenantAccess } from "../middlewares/requireTenantAccess.js";

const router = Router();
const requireOperationalAuth = requireAuth();
const requireTiendaAccess = requireTenantAccess((id) => tiendaRepository.findById(id), {
  resourceLabel: "Tienda"
});
const requireUsuarioAccess = requireTenantAccess((id) => usuarioRepository.findById(id), {
  resourceLabel: "Usuario"
});
const requireTransaccionAccess = requireTenantAccess((id) => transaccionRepository.findById(id), {
  resourceLabel: "Transaccion"
});
const requirePagoAccess = requireTenantAccess((id) => pagoRepository.findById(id), {
  resourceLabel: "Pago"
});
const requireLogisticaAccess = requireTenantAccess((id) => logisticaRepository.findById(id), {
  resourceLabel: "Logistica"
});

router.get("/", homeController.index);
router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/platform/login", platformAuthController.showLogin);
router.post("/platform/login", platformAuthController.login);
router.post("/platform/logout", platformAuthController.logout);
router.use("/comercios", requirePlatformAuth, buildCrudRoutes(comercioController));
router.use("/cuentas-comercio", requirePlatformAuth, buildCrudRoutes(accountController));
router.use("/tiendas", requireOperationalAuth, buildCrudRoutes(tiendaController, {
  showCreate: requireCommerceAdmin,
  create: requireCommerceAdmin,
  showDetail: requireTiendaAccess,
  showEdit: [requireCommerceAdmin, requireTiendaAccess],
  update: [requireCommerceAdmin, requireTiendaAccess],
  remove: [requireCommerceAdmin, requireTiendaAccess]
}));
router.use("/usuarios", requireOperationalAuth, buildCrudRoutes(usuarioController, {
  showDetail: requireUsuarioAccess,
  showEdit: requireUsuarioAccess,
  update: requireUsuarioAccess,
  remove: requireUsuarioAccess
}));
router.use("/transacciones", requireOperationalAuth, buildCrudRoutes(transaccionController, {
  showDetail: requireTransaccionAccess,
  showEdit: requireTransaccionAccess,
  update: requireTransaccionAccess,
  remove: requireTransaccionAccess
}));
router.use("/pagos", requireOperationalAuth, buildCrudRoutes(pagoController, {
  showDetail: requirePagoAccess,
  showEdit: requirePagoAccess,
  update: requirePagoAccess,
  remove: requirePagoAccess
}));
router.use("/suscripciones", requirePlatformAuth, buildCrudRoutes(suscripcionController));
router.use("/logisticas", requireOperationalAuth, buildCrudRoutes(logisticaController, {
  showDetail: requireLogisticaAccess,
  showEdit: requireLogisticaAccess,
  update: requireLogisticaAccess,
  remove: requireLogisticaAccess
}));
router.post("/logisticas/:id/despachar", requireOperationalAuth, requireLogisticaAccess, logisticaController.despachar);

router.get("/reportes/conciliacion", requireOperationalAuth, conciliacionController.report);
router.get("/reportes/hot-sale", requireOperationalAuth, estadisticaController.hotSale);
router.get("/reportes/facturacion", requirePlatformAuth, estadisticaController.facturacion);
router.get("/api/reportes/conciliacion", requireOperationalAuth, conciliacionController.reportJson);
router.get("/api/reportes/hot-sale", requireOperationalAuth, estadisticaController.hotSaleJson);
router.get("/api/reportes/facturacion", requirePlatformAuth, estadisticaController.facturacionJson);

export default router;
