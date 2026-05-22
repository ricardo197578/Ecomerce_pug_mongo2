import { Router } from "express";
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
import { requirePlatformAuth } from "../middlewares/requirePlatformAuth.js";

const router = Router();

router.get("/", homeController.index);
router.get("/platform/login", platformAuthController.showLogin);
router.post("/platform/login", platformAuthController.login);
router.post("/platform/logout", platformAuthController.logout);
router.use("/comercios", buildCrudRoutes(comercioController));
router.use("/tiendas", buildCrudRoutes(tiendaController));
router.use("/usuarios", buildCrudRoutes(usuarioController));
router.use("/transacciones", buildCrudRoutes(transaccionController));
router.use("/pagos", buildCrudRoutes(pagoController));
router.use("/suscripciones", requirePlatformAuth, buildCrudRoutes(suscripcionController));
router.use("/logisticas", buildCrudRoutes(logisticaController));
router.post("/logisticas/:id/despachar", logisticaController.despachar);

router.get("/reportes/conciliacion", conciliacionController.report);
router.get("/reportes/hot-sale", estadisticaController.hotSale);
router.get("/reportes/facturacion", requirePlatformAuth, estadisticaController.facturacion);
router.get("/api/reportes/conciliacion", conciliacionController.reportJson);
router.get("/api/reportes/hot-sale", estadisticaController.hotSaleJson);
router.get("/api/reportes/facturacion", requirePlatformAuth, estadisticaController.facturacionJson);

export default router;
