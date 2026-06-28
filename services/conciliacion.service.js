import { pagoRepository } from "../repositories/pago.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { buildScopeFilter } from "../utils/authContext.js";

function estadoEsperado(estadoPago) {
  if (estadoPago === "APROBADO") return "APROBADA";
  if (estadoPago === "RECHAZADO") return "RECHAZADA";
  return "PENDIENTE";
}

export const conciliacionService = {
  async conciliar(authContext = null) {
    const filter = buildScopeFilter(authContext);

    const [transacciones, pagos] = await Promise.all([
      transaccionRepository.findAll(filter),
      pagoRepository.findAll(filter)
    ]);
    const transaccionesByAnyId = new Map();
    transacciones.forEach((item) => {
      transaccionesByAnyId.set(String(item._id), item);
      if (item.id) transaccionesByAnyId.set(String(item.id), item);
    });

    const pagosByTransaccion = new Map(
      pagos.map((item) => [String(item.transaccionId), item])
    );
    const inconsistencias = [];

    transacciones.forEach((t) => {
      const transaccionDbId = String(t._id);
      const transaccionPublicId = t.id ? String(t.id) : null;
      const pago = pagosByTransaccion.get(transaccionDbId)
        || (transaccionPublicId ? pagosByTransaccion.get(transaccionPublicId) : null);
      if (!pago) {
        inconsistencias.push({
          tipo: "TRANSACCION_SIN_PAGO",
          transaccionId: transaccionDbId,
          transaccionRef: transaccionPublicId
        });
        return;
      }
      if (t.estado !== estadoEsperado(pago.estado)) {
        inconsistencias.push({
          tipo: "ESTADO_DESCUADRADO",
          transaccionId: transaccionDbId,
          pagoId: pago.id,
          estadoTransaccion: t.estado,
          estadoPago: pago.estado
        });
      }

      if (Number(t.monto) !== Number(pago.monto) || String(t.moneda) !== String(pago.moneda)) {
        inconsistencias.push({
          tipo: "MONTO_DESCUADRADO",
          transaccionId: transaccionDbId,
          pagoId: pago.id,
          montoTransaccion: t.monto,
          monedaTransaccion: t.moneda,
          montoPago: pago.monto,
          monedaPago: pago.moneda
        });
      }
    });

    pagos.forEach((pago) => {
      const transaccion = transaccionesByAnyId.get(String(pago.transaccionId));
      if (!transaccion) {
        inconsistencias.push({
          tipo: "PAGO_HUERFANO",
          pagoId: pago.id,
          transaccionId: pago.transaccionId
        });
      }
    });

    return {
      generadoEn: new Date().toISOString(),
      resumen: {
        transaccionesAnalizadas: transacciones.length,
        pagosAnalizados: pagos.length,
        totalInconsistencias: inconsistencias.length
      },
      inconsistencias
    };
  }
};
