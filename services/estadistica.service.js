import { comercioRepository } from "../repositories/comercio.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { buildScopeFilter, resolveScopedComercioId } from "../utils/authContext.js";

export const estadisticaService = {
  async getHotSaleReport(authContext = null) {
    const comercioId = resolveScopedComercioId(authContext, null);
    const filter = buildScopeFilter(authContext);
    const [transacciones, pagos, comercios] = await Promise.all([
      transaccionRepository.findAll(filter),
      pagoRepository.findAll(filter),
      comercioId
        ? comercioRepository.findById(comercioId).then((comercio) => (comercio ? [comercio] : []))
        : comercioRepository.findAll()
    ]);
    const comerciosById = new Map(comercios.map((item) => [String(item._id), item]));
    const totalTransacciones = transacciones.length;
    const totalPagos = pagos.length;
    const aprobados = pagos.filter((item) => item.estado === "APROBADO").length;
    const rechazados = pagos.filter((item) => item.estado === "RECHAZADO").length;
    const pendientes = transacciones.filter((item) => item.estado === "PENDIENTE").length;
    const gmvTotal = Number(
      transacciones.reduce((acc, item) => acc + Number(item.monto || 0), 0).toFixed(2)
    );
    const gmvAprobado = Number(
      pagos
        .filter((item) => item.estado === "APROBADO")
        .reduce((acc, item) => acc + Number(item.monto || 0), 0)
        .toFixed(2)
    );
    const ticketPromedio = totalTransacciones > 0 ? gmvTotal / totalTransacciones : 0;
    const tasaAprobacionPagos = totalPagos > 0 ? aprobados / totalPagos : 0;
    const tasaRechazoPagos = totalPagos > 0 ? rechazados / totalPagos : 0;
    const tasaTransaccionesPendientes =
      totalTransacciones > 0 ? pendientes / totalTransacciones : 0;

    const volumenPorComercio = new Map();
    transacciones.forEach((item) => {
      const key = String(item.comercioId);
      const previous = volumenPorComercio.get(key) || 0;
      volumenPorComercio.set(key, previous + Number(item.monto || 0));
    });
    const topComerciosPorVolumen = [...volumenPorComercio.entries()]
      .map(([comercioId, monto]) => {
        const comercio = comerciosById.get(comercioId);
        return {
          comercioId,
          comercioNombre: comercio ? comercio.nombre : "-",
          volumen: Number(monto.toFixed(2))
        };
      })
      .sort((a, b) => b.volumen - a.volumen)
      .slice(0, 5);

    const alertas = [];
    if (tasaAprobacionPagos < 0.7) {
      alertas.push({ nivel: "ALTA", mensaje: "Tasa de aprobacion por debajo de 70%." });
    }
    if (tasaRechazoPagos > 0.25) {
      alertas.push({ nivel: "MEDIA", mensaje: "Tasa de rechazo por encima de 25%." });
    }
    if (!alertas.length) {
      alertas.push({ nivel: "INFO", mensaje: "Sin alertas criticas." });
    }

    return {
      generadoEn: new Date().toISOString(),
      summary: {
        totalTransacciones,
        totalPagos,
        gmvTotal,
        gmvAprobado,
        ticketPromedio: Number(ticketPromedio.toFixed(2)),
        tasaAprobacionPagos: Number(tasaAprobacionPagos.toFixed(4)),
        tasaRechazoPagos: Number(tasaRechazoPagos.toFixed(4)),
        tasaTransaccionesPendientes: Number(tasaTransaccionesPendientes.toFixed(4))
      },
      topComerciosPorVolumen,
      alertas
    };
  }
};
