import React, { useMemo } from 'react';
import {
    Typography,
    Button,
    Box,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip as MuiChip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import { styled, useTheme } from '@mui/material/styles'; // useTheme is used, styled for StyledPaper is imported
import { useTheme } from '@mui/material/styles';
import { StyledPaper, LOGO_SAN_ISIDRO_URL } from '../../theme';
import { getLatestDisinfectionInfo } from '../../utils/disinfectionUtils';

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const DigitalCredential = ({ vehicle, navigate, showSnackbar }) => { // LOGO_SAN_ISIDRO_URL is imported
    const theme = useTheme();

    const formatDate = (timestamp) => {
        if (!timestamp) return 'PENDIENTE';
        // Assuming timestamp is a Firebase Timestamp object
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        // Fallback for other date string formats if necessary
        return new Date(timestamp).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const {
        ultimaFechaDesinfeccion,
        fechaVencimiento,
        ultimoReciboPago,
        ultimaUrlRecibo,
        ultimaTransaccionPago,
        ultimaUrlTransaccion,
        ultimoMontoPagado,
        ultimasObservaciones,
    } = useMemo(() => getLatestDisinfectionInfo(vehicle), [vehicle]);
    const credencialVencida = fechaVencimiento ? new Date() > fechaVencimiento : false;

    const generatePDF = async () => {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF no está cargado globalmente.");
            showSnackbar("Error al generar PDF: la librería jsPDF no está disponible.", "error");
            return;
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');

        const primaryColor = theme.palette.primary.dark;
        const textColor = '#333333';
        const lightTextColor = '#555555';
        const accentColor = theme.palette.secondary.main;

        const {
            ultimaFechaDesinfeccion: ultimaPDF,
            fechaVencimiento: fechaVencPDF,
            ultimoReciboPago: ultimoReciboPDF,
            ultimaUrlRecibo: ultimaUrlReciboPDF,
            ultimaTransaccionPago: ultimaTransaccionPDF,
            ultimaUrlTransaccion: ultimaUrlTransaccionPDF,
            ultimoMontoPagado: ultimoMontoPDF,
            ultimasObservaciones: ultimasObservacionesPDF,
        } = getLatestDisinfectionInfo(vehicle);
        const isVencidaPDF = fechaVencPDF ? new Date() > fechaVencPDF : false;

        try { pdf.setFont('Plus Jakarta Sans', 'normal'); } catch (e) { pdf.setFont('helvetica', 'normal'); }

        pdf.setFontSize(20); pdf.setTextColor(primaryColor); pdf.setFont('helvetica', 'bold');
        const tituloPdf = isVencidaPDF ? 'CREDENCIAL DE DESINFECCIÓN VENCIDA' : 'CREDENCIAL DE DESINFECCIÓN VEHICULAR';
        pdf.text(tituloPdf, pdf.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

        pdf.setFontSize(12); pdf.setTextColor(textColor); pdf.setFont('helvetica', 'normal');
        pdf.text("Municipalidad de San Isidro - Dirección de Control de Vectores", pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

        let yPos = 130; const lineHeight = 22; const sectionSpacing = 20; const leftMargin = 40; const valueOffset = 180;

        const addField = (label, value, isImportant = false) => {
            pdf.setFont('helvetica', 'bold'); pdf.setTextColor(textColor); pdf.text(label, leftMargin, yPos);
            pdf.setFont('helvetica', 'normal'); pdf.setTextColor(isImportant ? accentColor : lightTextColor);
            pdf.text(String(value || 'N/A'), leftMargin + valueOffset, yPos);
            yPos += lineHeight;
        };

        pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(primaryColor);
        pdf.text("Datos del Vehículo:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(11);

        addField("Patente:", vehicle.patente, true);
        addField("Marca:", vehicle.marca);
        addField("Tipo:", vehicle.tipoVehiculo || 'N/A');
        addField("Dimensiones:", `L:${vehicle.largo || 'N/A'} An:${vehicle.ancho || 'N/A'} Al:${vehicle.altura || 'N/A'} (m)`);
        addField("Metros Cúbicos:", `${parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³`);
        addField("Propietario:", vehicle.propietarioNombre);
        addField("Nº Vehículo Municipal:", vehicle.numeroVehiculoMunicipal || 'N/A');

        yPos += sectionSpacing; pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(primaryColor);
        pdf.text("Última Desinfección:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(11);

        addField("Fecha:", formatDate(ultimaPDF), true);
        addField("Recibo (MSI):", ultimoReciboPDF || 'N/A');
        if (ultimaUrlReciboPDF) addField("Foto Recibo:", "Adjunta (Ver sistema)");
        addField("Transacción:", ultimaTransaccionPDF || 'N/A');
        if (ultimaUrlTransaccionPDF) addField("Foto Trans.:", "Adjunta (Ver sistema)");
        addField("Monto Pagado:", ultimoMontoPDF ? `$${parseFloat(ultimoMontoPDF).toFixed(2)}` : 'N/A');
        addField("Observaciones:", ultimasObservacionesPDF || 'N/A');
        addField("Válida hasta:", formatDate(fechaVencPDF));

        yPos += sectionSpacing; pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(primaryColor);
        pdf.text("Historial de Desinfecciones:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(10); pdf.setTextColor(lightTextColor);

        if (vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0) {
            vehicle.historialDesinfecciones.forEach((item) => {
                if (yPos > pdf.internal.pageSize.getHeight() - 90) {
                    pdf.addPage(); yPos = 40;
                    pdf.setFontSize(14);pdf.setFont('helvetica', 'bold');pdf.setTextColor(primaryColor);
                    pdf.text("Historial (Cont.):", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2);
                    pdf.setFontSize(10);pdf.setTextColor(lightTextColor);
                }
                const montoItem = item.montoPagado ? `$${parseFloat(item.montoPagado).toFixed(2)}` : 'N/A';
                const obsItem = item.observaciones ? ` | Obs: ${item.observaciones.substring(0,20)}${item.observaciones.length > 20 ? '...' : ''}` : '';
                const reciboFoto = item.urlRecibo ? "(F)" : "";
                const transFoto = item.urlTransaccion ? "(F)" : "";
                pdf.text(`- ${formatDate(item.fecha)}, Rec: ${item.recibo}${reciboFoto}, Tr: ${item.transaccion || 'N/A'}${transFoto}, $: ${montoItem}${obsItem}`, leftMargin + 10, yPos);
                yPos += lineHeight - 7;
            });
        } else {
            pdf.text("No hay historial de desinfecciones.", leftMargin + 10, yPos); yPos += lineHeight;
        }

        yPos = pdf.internal.pageSize.getHeight() - 60;
        pdf.setFontSize(9); pdf.setTextColor("#777777");
        pdf.text(`Generada: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`, leftMargin, yPos);
        pdf.text(`ID Vehículo: ${vehicle.id}`, leftMargin, yPos + (lineHeight-10));

        try {
            const qrText = `${window.location.origin}?id=${vehicle.id}`;
            const qrDataUrl = await window.QRCode.toDataURL(qrText);
            const qrSize = 80;
            const qrMargin = 40;
            const qrX = pdf.internal.pageSize.getWidth() - qrMargin - qrSize;
            const qrY = pdf.internal.pageSize.getHeight() - qrMargin - qrSize;
            pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
            pdf.setTextColor('#333333');
            pdf.text('Para verificar autenticidad, escanee este código QR', qrX + qrSize / 2, qrY + qrSize + 12, { align: 'center' });
        } catch (e) {
            console.error('Error generando QR', e);
        }

        pdf.save(`credencial_${vehicle.patente}.pdf`);
    };

    return (
        <StyledPaper>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: -1, ml: -1 }}>
                <IconButton onClick={() => navigate(vehicle.createdBy ? 'admin' : 'home')} ><ArrowBackIcon /></IconButton>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3, borderBottom: `2px solid ${theme.palette.primary.main}`, pb: 2 }}>
                <img src={LOGO_SAN_ISIDRO_URL} alt="Logo San Isidro" style={{height: 50, marginBottom: theme.spacing(1)}} onError={(e) => e.target.style.display='none'}/>
                <Typography variant="h4" component="h2" sx={{ color: theme.palette.primary.dark }} gutterBottom>{credencialVencida ? 'CREDENCIAL DE DESINFECCIÓN VENCIDA' : 'CREDENCIAL DE DESINFECCIÓN'}</Typography>
                <Typography variant="subtitle1" color="text.secondary">Municipalidad de San Isidro - Dirección de Control de Vectores</Typography>
            </Box>

            <Box sx={{mb:3}}>
                <Box sx={{display:'flex', alignItems:'center', mb:1}}>
                    <DirectionsCarIcon sx={{mr:1, color: theme.palette.primary.main}} />
                    <Typography variant="h6" sx={{color: theme.palette.primary.dark}}>Datos del Vehículo</Typography>
                </Box>
                <Divider sx={{mb:1}} />
                <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}><Typography component="div"><strong>Patente:</strong> <MuiChip label={vehicle.patente} size="small" color="primary" /></Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography><strong>Marca:</strong> {vehicle.marca}</Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography><strong>Tipo:</strong> {vehicle.tipoVehiculo || 'N/A'}</Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography><strong>Dimensiones:</strong> L: {vehicle.largo || 'N/A'}m, An: {vehicle.ancho || 'N/A'}m, Al: {vehicle.altura || 'N/A'}m</Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography><strong>Metros Cúbicos:</strong> {parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³</Typography></Grid>
                    <Grid item xs={12} sm={6}><Typography><strong>Propietario:</strong> {vehicle.propietarioNombre}</Typography></Grid>
                    <Grid item xs={12}><Typography><strong>Nº Vehículo Municipal:</strong> {vehicle.numeroVehiculoMunicipal || 'N/A'}</Typography></Grid>
                </Grid>
            </Box>

            <Box sx={{mb:3}}>
                <Box sx={{display:'flex', alignItems:'center', mb:1}}>
                    <VerifiedUserIcon sx={{mr:1, color: ultimaFechaDesinfeccion ? theme.palette.success.main : theme.palette.warning.main}} />
                    <Typography variant="h6" sx={{color: ultimaFechaDesinfeccion ? theme.palette.success.dark : theme.palette.warning.dark}}>Última Desinfección</Typography>
                </Box>
                <Divider sx={{mb:1}} />
                <Typography variant="body1"><strong>Fecha:</strong> <span style={{ fontWeight: 'bold', color: ultimaFechaDesinfeccion ? theme.palette.success.dark : theme.palette.warning.dark }}>{formatDate(ultimaFechaDesinfeccion)}</span></Typography>
                <Typography variant="body1"><strong>Recibo (MSI):</strong> {ultimoReciboPago || 'N/A'} {ultimaUrlRecibo && <Button size="small" href={ultimaUrlRecibo} target="_blank" rel="noopener noreferrer">(Ver Foto)</Button>}</Typography>
                <Typography variant="body1"><strong>Nº Transacción:</strong> {ultimaTransaccionPago || 'N/A'} {ultimaUrlTransaccion && <Button size="small" href={ultimaUrlTransaccion} target="_blank" rel="noopener noreferrer">(Ver Foto)</Button>}</Typography>
                <Typography variant="body1"><strong>Monto Pagado:</strong> {ultimoMontoPagado ? `$${parseFloat(ultimoMontoPagado).toFixed(2)}` : 'N/A'}</Typography>
                <Typography variant="body1"><strong>Observaciones:</strong> {ultimasObservaciones || 'N/A'}</Typography>
                {fechaVencimiento && (
                    <Typography variant="body1" sx={{color: credencialVencida ? theme.palette.error.main : 'inherit'}}>
                        <strong>Válida hasta:</strong> {formatDate(fechaVencimiento)}
                    </Typography>
                )}
            </Box>


            <Box>
                <Box sx={{display:'flex', alignItems:'center', mb:1}}>
                    <CalendarTodayIcon sx={{mr:1, color: 'action.active'}} />
                    <Typography variant="h6" color="text.secondary">Historial de Desinfecciones</Typography>
                </Box>
                <Divider sx={{mb:1}} />
                {vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0 ? (
                    <List dense sx={{maxHeight: 200, overflow: 'auto', p:0}}>
                        {vehicle.historialDesinfecciones.map((item, index) => (
                            <ListItem key={index} divider sx={{py: 0.5}}>
                                <ListItemText
                                    primary={`Fecha: ${formatDate(item.fecha)}`}
                                    secondary={
                                        <>
                                        Recibo: {item.recibo} {item.urlRecibo && <Button size="small" sx={{ml:0.5, p:0.1}} href={item.urlRecibo} target="_blank">(F)</Button>} |
                                        Trans.: {item.transaccion || 'N/A'}{item.urlTransaccion && <Button size="small" sx={{ml:0.5, p:0.1}} href={item.urlTransaccion} target="_blank">(F)</Button>} |
                                        Monto: $${item.montoPagado ? parseFloat(item.montoPagado).toFixed(2) : 'N/A'} |
                                        Obs: {item.observaciones || '-'}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography color="text.secondary" sx={{fontStyle: 'italic'}}>No hay historial de desinfecciones registrado.</Typography>
                )}
            </Box>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                ID Credencial (Vehículo): {vehicle.id}
            </Typography>
            <Button fullWidth variant="contained" color="error" startIcon={<DownloadIcon />} onClick={generatePDF} sx={{ mt: 3, py: 1.2 }}>
                Descargar Credencial en PDF
            </Button>
        </StyledPaper>
    );
};

export default DigitalCredential;
