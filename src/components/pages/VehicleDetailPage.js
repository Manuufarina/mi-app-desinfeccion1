import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Button, Box, Paper, Grid, TextField, IconButton, List, ListItem, ListItemText,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import ArticleIcon from '@mui/icons-material/Article';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
// import { styled, useTheme } from '@mui/material/styles'; // useTheme is used, styled for StyledPaper is imported
import { useTheme } from '@mui/material/styles';
import { StyledPaper } from '../../theme'; // Import StyledPaper, theme is available via useTheme
import { getLatestDisinfectionInfo } from '../../utils/disinfectionUtils';
import { Timestamp } from 'firebase/firestore';
import { callGeminiAPI } from '../../services/geminiService';

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const VehicleDetailPage = ({
    vehicle,
    onAddDisinfection,
    onUpdateDisinfection,
    onDeleteDisinfection,
    onDeleteVehicle,
    navigate,
    showSnackbar,
    onOpenPaymentPage,
    valorMetroCubico,
    setGeminiLoading,
    autoShowAddForm = false,
    onAutoShowHandled,
    isRevisor = false
}) => {
    const theme = useTheme(); // MUI's useTheme hook
    const [showAddDisinfectionForm, setShowAddDisinfectionForm] = useState(false);
    const [disinfectionDate, setDisinfectionDate] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [transactionNumber, setTransactionNumber] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [observacionesPuntosClave, setObservacionesPuntosClave] = useState('');
    const [observacionesGeneradas, setObservacionesGeneradas] = useState('');
    const [reciboFile, setReciboFile] = useState(null);
    const [transaccionFile, setTransaccionFile] = useState(null);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [disinfectionDataToSubmit, setDisinfectionDataToSubmit] = useState(null);
    const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
    const [historySummary, setHistorySummary] = useState('');
    const [editRecord, setEditRecord] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(null);
    const [openDeleteVehicleDialog, setOpenDeleteVehicleDialog] = useState(false);

    useEffect(() => {
        if (autoShowAddForm) {
            setShowAddDisinfectionForm(true);
            if (onAutoShowHandled) onAutoShowHandled();
        }
    }, [autoShowAddForm, onAutoShowHandled]);

    const {
        ultimaFechaDesinfeccion,
        ultimoReciboPago,
        ultimaUrlRecibo,
        ultimaTransaccionPago,
        ultimaUrlTransaccion,
        ultimoMontoPagado,
        ultimasObservaciones,
    } = useMemo(() => getLatestDisinfectionInfo(vehicle), [vehicle]);

    const montoEstimado = useMemo(() => {
        const m3 = parseFloat(vehicle.metrosCubicos);
        const valor = parseFloat(valorMetroCubico);
        if (!isNaN(m3) && !isNaN(valor)) return (m3 * valor).toFixed(2);
        return 'N/A';
    }, [vehicle.metrosCubicos, valorMetroCubico]);

    useEffect(() => {
        if (showAddDisinfectionForm) {
            setAmountPaid(montoEstimado !== 'N/A' ? montoEstimado : '');
            setObservacionesGeneradas('');
            setObservacionesPuntosClave('');
            setReciboFile(null);
            setTransaccionFile(null);
        }
    }, [showAddDisinfectionForm, montoEstimado]);

    const handleFileChange = (event, setFileState) => {
        if (event.target.files && event.target.files[0]) {
            setFileState(event.target.files[0]);
        }
    };

    const handleGenerateObservacion = async () => {
        if (!observacionesPuntosClave.trim()) {
            showSnackbar("Ingrese puntos clave para generar la observación.", "info");
            return;
        }
        setGeminiLoading(true);
        try {
            const prompt = `Eres un asistente de la municipalidad de San Isidro. Redacta una observación concisa y profesional para un registro de desinfección vehicular.
            Patente del vehículo: ${vehicle.patente}.
            Fecha de desinfección: ${disinfectionDate ? new Date(disinfectionDate+"T00:00:00").toLocaleDateString('es-AR') : 'No especificada'}.
            Puntos clave proporcionados por el inspector: "${observacionesPuntosClave}".
            La observación debe ser breve y reflejar estos puntos de manera formal.`;
            const observacion = await callGeminiAPI(prompt);
            setObservacionesGeneradas(observacion);
            showSnackbar("Observación generada con IA.", "success");
        } catch (error) {
            showSnackbar("Error al generar observación con IA: " + error.message, "error");
        }
        setGeminiLoading(false);
    };

    const handleGenerateHistorySummary = async () => {
        setGeminiLoading(true);
        setHistorySummary('');
        try {
            const historialFormateado = (vehicle.historialDesinfecciones || [])
                .map(d => `Fecha: ${formatDate(d.fecha)}, Recibo: ${d.recibo}, Trans: ${d.transaccion || 'N/A'}, Monto: $${d.montoPagado ? parseFloat(d.montoPagado).toFixed(2) : 'N/A'}, Obs: ${d.observaciones || ''}`)
                .join('; ');

            if (!historialFormateado) {
                setHistorySummary("Este vehículo no tiene historial de desinfecciones registrado.");
                setOpenSummaryDialog(true);
                setGeminiLoading(false);
                return;
            }

            const prompt = `Eres un asistente de la municipalidad de San Isidro. Analiza el siguiente historial de desinfecciones para el vehículo con patente ${vehicle.patente} y genera un resumen breve y útil (máximo 3-4 frases) para un inspector. Destaca la fecha de la última desinfección y cualquier patrón o dato relevante si lo hubiera.
            Historial: "${historialFormateado}".`;
            const resumen = await callGeminiAPI(prompt);
            setHistorySummary(resumen);
            setOpenSummaryDialog(true);
        } catch (error) {
            showSnackbar("Error al generar resumen del historial: " + error.message, "error");
        }
        setGeminiLoading(false);
    };

    const handleOpenConfirmDialog = (e) => {
        e.preventDefault();
         if (!disinfectionDate || !receiptNumber || !transactionNumber || !amountPaid) {
            showSnackbar("Por favor, complete todos los campos del formulario de desinfección.", "warning");
            return;
        }
        if (isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) < 0) {
            showSnackbar("El monto pagado debe ser un número válido.", "error");
            return;
        }
        setDisinfectionDataToSubmit({
            fechaDesinfeccion: disinfectionDate,
            numeroReciboPago: receiptNumber,
            numeroTransaccionPago: transactionNumber,
            montoPagado: amountPaid,
            observaciones: observacionesGeneradas || observacionesPuntosClave
        });
        setOpenConfirmDialog(true);
    };

    const handleCloseConfirmDialog = (confirmed) => {
        setOpenConfirmDialog(false);
        if (confirmed && disinfectionDataToSubmit) {
            onAddDisinfection(vehicle.id, disinfectionDataToSubmit, reciboFile, transaccionFile);
            setShowAddDisinfectionForm(false);
            setDisinfectionDate('');
            setReceiptNumber('');
            setTransactionNumber('');
            setAmountPaid('');
            setObservacionesPuntosClave('');
            setObservacionesGeneradas('');
            setReciboFile(null);
            setTransaccionFile(null);
            setDisinfectionDataToSubmit(null);
        }
    };

    const handlePaymentClick = () => {
        if (showAddDisinfectionForm) {
            const monthCobra = disinfectionDate
                ? new Date(disinfectionDate + "T00:00:00").toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
            const observaciones = `Patente: ${vehicle.patente} - Mes: ${monthCobra} - Razón Social: ${vehicle.propietarioNombre}`;
            const importe = amountPaid ? parseFloat(amountPaid).toFixed(2) : montoEstimado;
            onOpenPaymentPage({
                patente: vehicle.patente,
                nombre: vehicle.propietarioNombre,
                importe,
                observaciones,
            });
        } else {
            onOpenPaymentPage();
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Assuming timestamp is a Firebase Timestamp object
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        // Fallback for other date string formats if necessary
        return new Date(timestamp).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={() => navigate(isRevisor ? 'searchDisinfection' : 'admin')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" sx={{ml:1, color: theme.palette.primary.dark}}>Detalles del Vehículo</Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{color: theme.palette.primary.light, fontWeight: 'medium'}}>{vehicle.patente}</Typography>

            <Paper elevation={0} sx={{ my: 2, p:2, backgroundColor: theme.palette.grey[50] || '#fafafa', borderRadius:1.5 }}>
                <Typography><strong>Marca:</strong> {vehicle.marca}</Typography>
                <Typography><strong>Tipo:</strong> {vehicle.tipoVehiculo || 'N/A'}</Typography>
                <Typography><strong>Dimensiones:</strong> L: {vehicle.largo || 'N/A'}m, An: {vehicle.ancho || 'N/A'}m, Al: {vehicle.altura || 'N/A'}m</Typography>
                <Typography><strong>Metros Cúbicos:</strong> {parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³</Typography>
                <Typography><strong>Propietario:</strong> {vehicle.propietarioNombre}</Typography>
                <Typography><strong>Nº Vehículo Municipal:</strong> {vehicle.numeroVehiculoMunicipal || 'N/A'}</Typography>
                <Divider sx={{my:1}}/>
                <Typography><strong>Última Desinfección:</strong> <span style={{ fontWeight: 'bold', color: ultimaFechaDesinfeccion ? theme.palette.success.dark : theme.palette.warning.dark }}>{formatDate(ultimaFechaDesinfeccion)}</span></Typography>
                <Typography><strong>Último Recibo:</strong> {ultimoReciboPago || 'N/A'} {ultimaUrlRecibo && <Button size="small" href={ultimaUrlRecibo} target="_blank" rel="noopener noreferrer">Ver Foto</Button>}</Typography>
                <Typography><strong>Última Transacción:</strong> {ultimaTransaccionPago || 'N/A'} {ultimaUrlTransaccion && <Button size="small" href={ultimaUrlTransaccion} target="_blank" rel="noopener noreferrer">Ver Foto</Button>}</Typography>
                <Typography><strong>Último Monto Pagado:</strong> $ {ultimoMontoPagado ? parseFloat(ultimoMontoPagado).toFixed(2) : 'N/A'}</Typography>
                <Typography><strong>Últimas Observaciones:</strong> {ultimasObservaciones || 'N/A'}</Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
                {!isRevisor && (
                    <>
                        <Button variant="contained" color="secondary" startIcon={<AddCircleIcon />} onClick={() => setShowAddDisinfectionForm(!showAddDisinfectionForm)}>
                            {showAddDisinfectionForm ? 'Cancelar Registro' : 'Registrar Desinfección'}
                        </Button>
                        <Button variant="outlined" color="primary" startIcon={<PaymentIcon />} onClick={handlePaymentClick}>
                            Generar Boleta de Pago
                        </Button>
                    </>
                )}
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => navigate('credential', vehicle)}>
                    Ver Credencial
                </Button>
                {!isRevisor && (
                    <>
                        <Button variant="outlined" color="warning" startIcon={<SettingsIcon />} onClick={() => navigate('editVehicle', vehicle)}>
                            Editar Vehículo
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setOpenDeleteVehicleDialog(true)}>
                            Eliminar Vehículo
                        </Button>
                    </>
                )}
                <Button variant="outlined" color="info" startIcon={<AutoAwesomeIcon />} onClick={handleGenerateHistorySummary}>
                    ✨ Resumir Historial (IA)
                </Button>
            </Box>

            {!isRevisor && showAddDisinfectionForm && (
                <Paper component="form" onSubmit={handleOpenConfirmDialog} sx={{ p: 2.5, mt: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1.5 }} elevation={2}>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.secondary.dark }}>Nueva Desinfección</Typography>
                    <Typography variant="subtitle1" gutterBottom>Monto Estimado a Pagar: <strong>${montoEstimado}</strong></Typography>
                    <TextField type="date" label="Fecha de Desinfección" value={disinfectionDate} onChange={(e) => setDisinfectionDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />

                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                           <TextField label="Número de Recibo de Pago (MSI)" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} fullWidth margin="normal" required />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{mt: {xs:0, sm:1}}}>
                                Foto Recibo
                                <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, setReciboFile)} />
                            </Button>
                            {reciboFile && <Typography variant="caption" display="block" sx={{mt:0.5, textAlign:'center'}}>{reciboFile.name}</Typography>}
                        </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                            <TextField label="Número de Transacción de Pago" value={transactionNumber} onChange={(e) => setTransactionNumber(e.target.value)} fullWidth margin="normal" required InputProps={{ startAdornment: <ArticleIcon sx={{mr:1, color:'action.active'}}/> }}/>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                             <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{mt: {xs:0, sm:1}}}>
                                Foto Trans.
                                <input type="file" hidden accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, setTransaccionFile)} />
                            </Button>
                            {transaccionFile && <Typography variant="caption" display="block" sx={{mt:0.5, textAlign:'center'}}>{transaccionFile.name}</Typography>}
                        </Grid>
                    </Grid>

                    <TextField label="Monto Pagado ($)" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} fullWidth margin="normal" required InputProps={{ startAdornment: <AttachMoneyIcon sx={{mr:1, color:'action.active'}}/> }}/>

                    <TextField label="Puntos Clave para Observaciones (Opcional)" value={observacionesPuntosClave} onChange={(e) => setObservacionesPuntosClave(e.target.value)} fullWidth margin="normal" multiline rows={2} />
                    <Button onClick={handleGenerateObservacion} startIcon={<AutoAwesomeIcon />} size="small" sx={{my:1}} disabled={!observacionesPuntosClave.trim()}>
                        ✨ Generar Observación con IA
                    </Button>
                    <TextField label="Observaciones (Editable)" value={observacionesGeneradas || observacionesPuntosClave} onChange={(e) => setObservacionesGeneradas(e.target.value)} fullWidth margin="normal" multiline rows={3} helperText="Puede editar la observación generada o escribirla manualmente."/>

                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 1.5, py: 1 }}>Guardar Desinfección</Button>
                </Paper>
            )}

            <Typography variant="h6" sx={{ mt: 3, mb: 1, color: theme.palette.primary.dark }}>Historial de Desinfecciones</Typography>
            {vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0 ? (
                <Paper elevation={0} sx={{maxHeight: 220, overflow: 'auto', backgroundColor: theme.palette.grey[100] || '#f5f5f5', borderRadius:1.5, p:1}}>
                    <List dense >
                        {vehicle.historialDesinfecciones.map((item, index) => (
                            <ListItem
                                key={index}
                                divider
                                sx={{ py: 0.5 }}
                                secondaryAction={!isRevisor && (
                                    <>
                                        <IconButton edge="end" size="small" onClick={() => setEditRecord(item)}>
                                            <EditIcon fontSize="inherit" />
                                        </IconButton>
                                        <IconButton edge="end" size="small" onClick={() => setOpenDeleteDialog(item.fechaRegistro.toMillis())}>
                                            <DeleteIcon fontSize="inherit" />
                                        </IconButton>
                                    </>
                                )}
                            >
                                <ListItemText
                                    primary={`Fecha: ${formatDate(item.fecha)}`}
                                    secondary={
                                        <>
                                            Recibo: {item.recibo} {item.urlRecibo && (
                                                <Button size="small" sx={{ ml: 1, p: 0.2 }} href={item.urlRecibo} target="_blank">
                                                    Ver
                                                </Button>
                                            )} |
                                            Trans.: {item.transaccion || 'N/A'} {item.urlTransaccion && (
                                                <Button size="small" sx={{ ml: 1, p: 0.2 }} href={item.urlTransaccion} target="_blank">
                                                    Ver
                                                </Button>
                                            )} |
                                            Monto: $${item.montoPagado ? parseFloat(item.montoPagado).toFixed(2) : 'N/A'} |
                                            Obs: {item.observaciones || '-'}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            ) : (
                <Typography color="text.secondary" sx={{fontStyle: 'italic'}}>No hay historial de desinfecciones para este vehículo.</Typography>
            )}
             <Dialog open={openConfirmDialog} onClose={() => handleCloseConfirmDialog(false)}>
                <DialogTitle>Confirmar Registro de Desinfección</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        ¿Está seguro de que desea registrar esta desinfección? <br/>
                        Fecha: {disinfectionDate && new Date(disinfectionDate+"T00:00:00").toLocaleDateString('es-AR')} <br/>
                        Recibo MSI: {receiptNumber} {reciboFile && `(${reciboFile.name})`} <br/>
                        Nº Transacción: {transactionNumber} {transaccionFile && `(${transaccionFile.name})`} <br/>
                        Monto Pagado: ${amountPaid} <br/>
                        Observaciones: {disinfectionDataToSubmit?.observaciones || "N/A"}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseConfirmDialog(false)} color="inherit">Cancelar</Button>
                    <Button onClick={() => handleCloseConfirmDialog(true)} color="primary" autoFocus>Confirmar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openSummaryDialog} onClose={() => setOpenSummaryDialog(false)}>
                <DialogTitle sx={{display:'flex', alignItems:'center'}}><AutoAwesomeIcon sx={{mr:1, color:'primary.main'}}/>Resumen del Historial (IA)</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{whiteSpace: 'pre-wrap'}}>
                        {historySummary || "Generando resumen..."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSummaryDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={Boolean(editRecord)} onClose={() => setEditRecord(null)}>
                <DialogTitle>Editar Registro</DialogTitle>
                {editRecord && (
                    <>
                        <DialogContent>
                            <TextField
                                type="date"
                                label="Fecha"
                                value={editRecord.fecha && new Date(editRecord.fecha.toDate ? editRecord.fecha.toDate() : editRecord.fecha).toISOString().slice(0,10)}
                                onChange={(e) => setEditRecord({ ...editRecord, fecha: new Date(e.target.value + 'T00:00:00') })}
                                fullWidth
                                margin="dense"
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField label="Recibo" value={editRecord.recibo} onChange={(e)=>setEditRecord({...editRecord,recibo:e.target.value})} fullWidth margin="dense" />
                            <TextField label="Transacción" value={editRecord.transaccion || ''} onChange={(e)=>setEditRecord({...editRecord,transaccion:e.target.value})} fullWidth margin="dense" />
                            <TextField label="Monto Pagado" type="number" value={editRecord.montoPagado} onChange={(e)=>setEditRecord({...editRecord,montoPagado:e.target.value})} fullWidth margin="dense" />
                            <TextField label="Observaciones" value={editRecord.observaciones || ''} onChange={(e)=>setEditRecord({...editRecord,observaciones:e.target.value})} fullWidth multiline rows={3} margin="dense" />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditRecord(null)}>Cancelar</Button>
                            <Button onClick={() => { onUpdateDisinfection(vehicle.id, editRecord.fechaRegistro.toMillis(), { fecha: editRecord.fecha instanceof Date ? Timestamp.fromDate(editRecord.fecha) : editRecord.fecha, recibo: editRecord.recibo, transaccion: editRecord.transaccion || '', montoPagado: parseFloat(editRecord.montoPagado) || 0, observaciones: editRecord.observaciones || '' }); setEditRecord(null); }} color="primary">Guardar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            <Dialog open={Boolean(openDeleteDialog)} onClose={() => setOpenDeleteDialog(null)}>
                <DialogTitle>Eliminar Registro</DialogTitle>
                <DialogContent><DialogContentText>¿Eliminar este registro de desinfección?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(null)}>Cancelar</Button>
                    <Button color="error" onClick={() => { onDeleteDisinfection(vehicle.id, openDeleteDialog); setOpenDeleteDialog(null); }}>Eliminar</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openDeleteVehicleDialog} onClose={() => setOpenDeleteVehicleDialog(false)}>
                <DialogTitle>Eliminar Vehículo</DialogTitle>
                <DialogContent><DialogContentText>¿Está seguro de eliminar el vehículo {vehicle.patente} y todo su historial?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteVehicleDialog(false)}>Cancelar</Button>
                    <Button color="error" onClick={() => { onDeleteVehicle(vehicle.id); setOpenDeleteVehicleDialog(false); }}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </StyledPaper>
    );
};

export default VehicleDetailPage;
