import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { logisticaRepository } from "../repositories/logistica.repository.js";
import { suscripcionRepository } from "../repositories/suscripcion.repository.js";
import { buildScopeFilter, getAuthContext } from "../utils/authContext.js";

export const homeController = {
  async index(req, res, next) {
    try {
      const authContext = getAuthContext(req);

      if (!authContext.isAuthenticated) {
        return res.render("home", {
          title: "Inicio",
          counts: null
        });
      }

      let comercioPromise;
      let tiendasPromise;
      if (authContext.isPlatformAdmin) {
        comercioPromise = comercioRepository.findAll();
        tiendasPromise = tiendaRepository.findAll();
      } else if (authContext.comercioId) {
        comercioPromise = comercioRepository.findById(authContext.comercioId)
          .then((comercio) => (comercio ? [comercio] : []));
        tiendasPromise = authContext.tiendaId
          ? tiendaRepository.findById(authContext.tiendaId).then((tienda) => (tienda ? [tienda] : []))
          : tiendaRepository.findAll({ comercioId: authContext.comercioId });
      } else {
        comercioPromise = Promise.resolve([]);
        tiendasPromise = Promise.resolve([]);
      }
      const tenantFilter = buildScopeFilter(authContext);

      const [comercios, tiendas, usuarios, transacciones, pagos, logisticas, suscripciones] =
        await Promise.all([
          comercioPromise,
          tiendasPromise,
          usuarioRepository.findAll(tenantFilter),
          transaccionRepository.findAll(tenantFilter),
          pagoRepository.findAll(tenantFilter),
          logisticaRepository.findAll(tenantFilter),
          authContext.isPlatformAdmin ? suscripcionRepository.findAll() : Promise.resolve([])
        ]);

      res.render("home", {
        title: "Inicio",
        counts: {
          comercios: comercios.length,
          tiendas: tiendas.length,
          usuarios: usuarios.length,
          transacciones: transacciones.length,
          pagos: pagos.length,
          logisticas: logisticas.length,
          suscripciones: suscripciones.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
