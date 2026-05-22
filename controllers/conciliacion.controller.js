import { conciliacionService } from "../services/conciliacion.service.js";

export const conciliacionController = {
  async report(_req, res, next) {
    try {
      const data = await conciliacionService.conciliar();
      res.render("reportes/conciliacion", { title: "Conciliacion", data });
    } catch (error) {
      next(error);
    }
  },
  async reportJson(_req, res, next) {
    try {
      const data = await conciliacionService.conciliar();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
