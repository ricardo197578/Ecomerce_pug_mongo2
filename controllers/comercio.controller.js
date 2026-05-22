import { buildCrudController } from "./crud.controller.js";
import { comercioService } from "../services/comercio.service.js";

export const comercioController = buildCrudController({
  title: "Comercio",
  service: comercioService,
  viewPath: "comercios",
  formDefaults: { nombre: "", cuit: "", email: "", activo: true }
});
