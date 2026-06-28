import { estadisticaService } from "../services/estadistica.service.js";
import { suscripcionService } from "../services/suscripcion.service.js";
import { getAuthContext } from "../utils/authContext.js";

export const estadisticaController = {
  async hotSale(req, res, next) {
    try {
      const data = await estadisticaService.getHotSaleReport(getAuthContext(req));
      res.render("reportes/hot-sale", { title: "Hot Sale", data });
    } catch (error) {
      next(error);
    }
  },
  async hotSaleJson(req, res, next) {
    try {
      const data = await estadisticaService.getHotSaleReport(getAuthContext(req));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
  async facturacion(_req, res, next) {
    try {
      const data = await suscripcionService.getFacturacionResumen();
      res.render("reportes/facturacion", { title: "Facturacion", data });
    } catch (error) {
      next(error);
    }
  },
  async facturacionJson(_req, res, next) {
    try {
      const data = await suscripcionService.getFacturacionResumen();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
