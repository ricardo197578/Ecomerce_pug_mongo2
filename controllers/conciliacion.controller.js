import { conciliacionService } from "../services/conciliacion.service.js";
import { getAuthContext } from "../utils/authContext.js";

export const conciliacionController = {
  async report(req, res, next) {
    try {
      const data = await conciliacionService.conciliar(getAuthContext(req));
      res.render("reportes/conciliacion", { title: "Conciliacion", data });
    } catch (error) {
      next(error);
    }
  },
  async reportJson(req, res, next) {
    try {
      const data = await conciliacionService.conciliar(getAuthContext(req));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
