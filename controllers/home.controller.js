import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { logisticaRepository } from "../repositories/logistica.repository.js";
import { suscripcionRepository } from "../repositories/suscripcion.repository.js";

export const homeController = {
  async index(_req, res, next) {
    try {
      const [comercios, tiendas, usuarios, transacciones, pagos, logisticas, suscripciones] =
        await Promise.all([
          comercioRepository.findAll(),
          tiendaRepository.findAll(),
          usuarioRepository.findAll(),
          transaccionRepository.findAll(),
          pagoRepository.findAll(),
          logisticaRepository.findAll(),
          suscripcionRepository.findAll()
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
