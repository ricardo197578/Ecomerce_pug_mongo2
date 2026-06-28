import { comercioService } from "../services/comercio.service.js";
import { logisticaService } from "../services/logistica.service.js";
import { transaccionService } from "../services/transaccion.service.js";
import { usuarioService } from "../services/usuario.service.js";
import { getAuthContext } from "../utils/authContext.js";

const formDefaults = {
  transaccionId: "",
  estado: "PENDIENTE",
  transportista: "SIM_LOGISTICS",
  detalle: ""
};

async function loadFormOptions(authContext) {
  const transacciones = await transaccionService.getAll(authContext);
  return {
    transacciones: transacciones.filter((item) => item.estado === "APROBADA")
  };
}

export const logisticaController = {
  async list(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [items, comercios, usuarios] = await Promise.all([
        logisticaService.getAll(authContext),
        comercioService.getAll(authContext),
        usuarioService.getAll(authContext)
      ]);
      const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
      const usuariosById = new Map(usuarios.map((usuario) => [String(usuario._id), usuario]));
      const itemsView = items.map((item) => {
        const comercio = comerciosById.get(String(item.comercioId));
        const usuario = usuariosById.get(String(item.usuarioId));
        return {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-",
          usuarioNombre: usuario ? usuario.nombre : "-"
        };
      });
      res.render("logisticas/index", { title: "Logisticas", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const options = await loadFormOptions(authContext);
      res.render("logisticas/form", {
        title: "Nueva Logistica",
        formData: formDefaults,
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar",
        ...options
      });
    } catch (error) {
      next(error);
    }
  },
  async create(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await logisticaService.create(req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("logisticas/form", {
            title: "Nueva Logistica",
            formData: { ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar",
            ...options
          });
        } catch (innerError) {
          return next(innerError);
        }
      }
      next(error);
    }
  },
  async showDetail(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const item = await logisticaService.getById(req.params.id, authContext);
      res.render("logisticas/show", { title: "Logistica", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [item, options] = await Promise.all([
        logisticaService.getById(req.params.id, authContext),
        loadFormOptions(authContext)
      ]);
      res.render("logisticas/form", {
        title: "Editar Logistica",
        formData: item,
        errorMessage: null,
        formAction: `/${item._id}/edit`,
        submitLabel: "Actualizar",
        ...options
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await logisticaService.update(req.params.id, req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("logisticas/form", {
            title: "Editar Logistica",
            formData: { _id: req.params.id, ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar",
            ...options
          });
        } catch (innerError) {
          return next(innerError);
        }
      }
      next(error);
    }
  },
  async remove(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await logisticaService.remove(req.params.id, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  },
  async despachar(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await logisticaService.despachar(req.params.id, authContext);
      res.redirect("/logisticas");
    } catch (error) {
      next(error);
    }
  }
};
