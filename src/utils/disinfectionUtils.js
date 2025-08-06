import { DIAS_VIGENCIA_TIPO } from '../theme';

export const getLatestDisinfectionInfo = (vehicle = {}) => {
  const historial = vehicle.historialDesinfecciones || [];
  if (!historial.length) {
    return {
      ultimaFechaDesinfeccion: null,
      fechaVencimiento: null,
      ultimoReciboPago: null,
      ultimaUrlRecibo: null,
      ultimaTransaccionPago: null,
      ultimaUrlTransaccion: null,
      ultimoMontoPagado: null,
      ultimasObservaciones: null,
    };
  }
  const sorted = [...historial].sort((a, b) => {
    const dateA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
    const dateB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
    return dateB - dateA;
  });
  const latest = sorted[0];
  const ultimaDate = latest.fecha?.toDate ? latest.fecha.toDate() : new Date(latest.fecha);
  const diasVigencia = DIAS_VIGENCIA_TIPO[vehicle.tipoVehiculo] || 30;
  const fechaVencimiento = ultimaDate
    ? new Date(ultimaDate.getTime() + diasVigencia * 24 * 60 * 60 * 1000)
    : null;

  return {
    ultimaFechaDesinfeccion: ultimaDate,
    fechaVencimiento,
    ultimoReciboPago: latest.recibo || null,
    ultimaUrlRecibo: latest.urlRecibo || null,
    ultimaTransaccionPago: latest.transaccion || null,
    ultimaUrlTransaccion: latest.urlTransaccion || null,
    ultimoMontoPagado: latest.montoPagado || null,
    ultimasObservaciones: latest.observaciones || null,
  };
};
