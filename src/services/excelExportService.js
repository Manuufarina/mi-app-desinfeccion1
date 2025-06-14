import * as XLSX from 'xlsx';

export const exportDisinfectionsToExcel = (vehicles, fromDate, toDate) => {
    const rows = [];
    vehicles.forEach(v => {
        const historial = v.historialDesinfecciones || [];
        historial.forEach(h => {
            const fecha = h.fecha && typeof h.fecha.toDate === 'function' ? h.fecha.toDate() : new Date(h.fecha);
            if (fromDate && fecha < fromDate) return;
            if (toDate && fecha > toDate) return;
            rows.push({
                Patente: v.patente,
                Propietario: v.propietarioNombre || '',
                Tipo: v.tipoVehiculo || '',
                Fecha: fecha.toLocaleDateString('es-AR'),
                Recibo: h.recibo || '',
                Transaccion: h.transaccion || '',
                Monto: h.montoPagado || '',
                Observaciones: h.observaciones || ''
            });
        });
    });
    if (rows.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Desinfecciones');
    XLSX.writeFile(workbook, 'desinfecciones.xlsx');
};
