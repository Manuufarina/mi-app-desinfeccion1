/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc, 
    getDoc,
    Timestamp,
    onSnapshot,
    setDoc 
} from 'firebase/firestore';
import { 
    getStorage, 
    ref as storageRef, // Renombrar para evitar conflicto con React.useRef
    uploadBytes, 
    getDownloadURL 
} from "firebase/storage"; // Para la carga de imágenes

// Material-UI Components
import {
    Container, AppBar, Toolbar, Typography, Button, TextField, Box, Paper, Grid,
    CircularProgress, Alert, Snackbar, IconButton, List, ListItem, ListItemText,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Accordion, AccordionSummary, AccordionDetails, Chip as MuiChip,
    Modal, Select, MenuItem, FormControl, InputLabel, InputAdornment, Tooltip as MuiTooltip,
    Divider 
} from '@mui/material';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Material-UI Icons
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; 
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'; 
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; 
import ReceiptIcon from '@mui/icons-material/Receipt'; 
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import CloseIcon from '@mui/icons-material/Close';
import ArticleIcon from '@mui/icons-material/Article'; 
import StraightenIcon from '@mui/icons-material/Straighten'; 
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Para carga de archivos
import DeleteIcon from '@mui/icons-material/Delete';

// Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const LOGO_SAN_ISIDRO_URL = "https://www.sanisidro.gob.ar/sites/default/files/logo_san_isidro_horizontal_blanco_web_1.png"; 

const firebaseConfigString = typeof __firebase_config !== 'undefined' && __firebase_config
  ? __firebase_config
  : JSON.stringify({
      apiKey: "AIzaSyC5K4XwBY_JhFiEFIFQR-E9l-70NlSI_lA", 
      authDomain: "desinfeccion-san-isidro.firebaseapp.com",
      projectId: "desinfeccion-san-isidro",
      storageBucket: "desinfeccion-san-isidro.appspot.com", // Corregido a .appspot.com (estándar)
      messagingSenderId: "6257839819",
      appId: "1:6257839819:web:46c5b320b2161f8ea4554e"
    });

const firebaseConfig = JSON.parse(firebaseConfigString);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inicializar Firebase Storage

const appId = typeof __app_id !== 'undefined' && __app_id
  ? __app_id
  : 'desinfeccion-vehicular-msi-app';

const sanIsidroGreen = '#005A2B'; 
const sanIsidroLightGreen = '#4CAF50'; 
const sanIsidroAccent = '#D4AF37'; 

const theme = createTheme({
    palette: {
        primary: { main: sanIsidroGreen },
        secondary: { main: sanIsidroLightGreen },
        accent: { main: sanIsidroAccent },
        background: { default: '#f4f6f8', paper: '#ffffff' }
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700 }, h5: { fontWeight: 600 }, h6: { fontWeight: 500 },
    },
    components: {
        MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 }}},
        MuiPaper: { styleOverrides: { root: { borderRadius: 12 }}},
        MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' }}}
    }
});

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
}));

const TIPOS_VEHICULO = ["Particular", "Remis", "Escolar", "Transporte de Carga", "Taxi", "Otro"];
const VALOR_METRO_CUBICO_DEFAULT = 150; 

// IMPORTANTE: Reemplaza "" con tu API Key real de Gemini
const GEMINI_API_KEY = ""; // <--- REEMPLAZA ESTO CON TU API KEY

async function callGeminiAPI(promptText) {
    if (!GEMINI_API_KEY) {
        console.warn("API Key de Gemini no configurada. La llamada a la IA no se realizará.");
        // Podrías devolver un mensaje por defecto o lanzar un error específico
        // para que la UI lo maneje, en lugar de que la app falle silenciosamente.
        return "Función de IA no disponible (API Key no configurada).";
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Error en API Gemini:", response.status, errorBody);
            throw new Error(`Error de la API de Gemini: ${response.status}. ${errorBody}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Respuesta inesperada de Gemini:", result);
            throw new Error("Respuesta inesperada o vacía de la API de Gemini.");
        }
    } catch (error) {
        console.error("Error llamando a Gemini API:", error);
        throw error; 
    }
}


function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [selectedVehicleForApp, setSelectedVehicleForApp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allVehiclesForDashboard, setAllVehiclesForDashboard] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [valorMetroCubico, setValorMetroCubico] = useState(VALOR_METRO_CUBICO_DEFAULT);
    const [configDocId, setConfigDocId] = useState(null);
    const [geminiLoading, setGeminiLoading] = useState(false);


    const vehiclesCollectionPath = `artifacts/${appId}/public/data/vehiculos`;
    const configCollectionPath = `artifacts/${appId}/public/data/configuracion`; 

    useEffect(() => {
        const configRef = collection(db, configCollectionPath);
        const q = query(configRef, where("clave", "==", "valorMetroCubico"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const configData = snapshot.docs[0].data();
                setValorMetroCubico(parseFloat(configData.valor) || VALOR_METRO_CUBICO_DEFAULT);
                setConfigDocId(snapshot.docs[0].id);
            } else {
                const defaultConfigRef = doc(configRef); 
                setDoc(defaultConfigRef, { clave: "valorMetroCubico", valor: VALOR_METRO_CUBICO_DEFAULT })
                    .then(() => setConfigDocId(defaultConfigRef.id))
                    .catch(err => console.error("Error creando config por defecto: ", err));
            }
        }, (error) => {
            console.error("Error cargando configuración: ", error);
            showSnackbar("Error al cargar configuración de precios.", "error");
        });
        return () => unsubscribe();
    }, [configCollectionPath]);

    const handleUpdateValorMetroCubico = async (nuevoValor) => {
        const valorNumerico = parseFloat(nuevoValor);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            showSnackbar("El valor por m³ debe ser un número positivo.", "error"); return;
        }
        setLoading(true);
        try {
            const ref = configDocId ? doc(db, configCollectionPath, configDocId) : doc(collection(db, configCollectionPath));
            await setDoc(ref, { clave: "valorMetroCubico", valor: valorNumerico }, { merge: !configDocId }); 
            if(!configDocId) setConfigDocId(ref.id);
            setValorMetroCubico(valorNumerico);
            showSnackbar("Valor por m³ actualizado.", "success");
        } catch (error) {
            console.error("Error actualizando valor: ", error);
            showSnackbar("Error al actualizar valor.", "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) setCurrentUser(user);
            else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
                    else await signInAnonymously(auth);
                } catch (e) { console.error("Auth Error: ", e); showSnackbar("Error de autenticación.", "error"); }
            }
            setIsAuthReady(true);
        });
        return () => unsubAuth();
    }, []);
    
    useEffect(() => {
        if (!isAuthReady || !currentUser) return;
        setLoading(true);
        const q = query(collection(db, vehiclesCollectionPath));
        const unsubVehicles = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAllVehiclesForDashboard(data);
            if (currentPage === 'admin' && !searchTerm) setSearchResults(data);
            setLoading(false);
        }, (err) => { console.error("Vehicle Fetch Error: ", err); showSnackbar("Error al cargar vehículos.", "error"); setLoading(false); });
        return () => unsubVehicles();
    }, [isAuthReady, currentUser, vehiclesCollectionPath, currentPage, searchTerm]);

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleCloseSnackbar = (_, reason) => reason !== 'clickaway' && setSnackbar({ ...snackbar, open: false });

    const handleRegisterVehicle = async (vehicleData) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            const q = query(collection(db, vehiclesCollectionPath), where("patente", "==", vehicleData.patente.toUpperCase()));
            if (!(await getDocs(q)).empty) { showSnackbar("Patente ya registrada.", "error"); setLoading(false); return; }
            
            const m3Num = parseFloat(vehicleData.metrosCubicos);
            if (isNaN(m3Num) || m3Num <=0) { showSnackbar("Metros cúbicos inválidos.", "error"); setLoading(false); return; }

            const dataToSave = { ...vehicleData, patente: vehicleData.patente.toUpperCase(), metrosCubicos: m3Num, fechaCreacion: Timestamp.now(), historialDesinfecciones: [], createdBy: currentUser.uid };
            const docRef = await addDoc(collection(db, vehiclesCollectionPath), dataToSave);
            showSnackbar("Vehículo registrado.", "success");
            setSelectedVehicleForApp({ id: docRef.id, ...dataToSave });
            setCurrentPage('credential');
        } catch (e) { console.error("Register Error: ", e); showSnackbar("Error al registrar.", "error"); }
        setLoading(false);
    };

    const handleSearchVehicle = async () => {
        if (!searchTerm.trim()) { setSearchResults(allVehiclesForDashboard); return; }
        setLoading(true);
        const results = allVehiclesForDashboard.filter(v => v.patente.toUpperCase().includes(searchTerm.trim().toUpperCase()));
        setSearchResults(results);
        if (results.length === 0) showSnackbar("No se encontraron vehículos.", "info");
        setLoading(false);
    };
    
    const handleSelectVehicleForDetail = async (vehicleId) => {
        setLoading(true);
        try {
            const docSnap = await getDoc(doc(db, vehiclesCollectionPath, vehicleId));
            if (docSnap.exists()) { setSelectedVehicleForApp({ id: docSnap.id, ...docSnap.data() }); setCurrentPage('vehicleDetail'); }
            else showSnackbar("Vehículo no encontrado.", "error");
        } catch (e) { console.error("Select Error: ", e); showSnackbar("Error al cargar vehículo.", "error"); }
        setLoading(false);
    };

    // Función para subir archivos a Firebase Storage
    const uploadFileToStorage = async (file, path) => {
        if (!file) return null;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };


    const handleAddDisinfection = async (vehicleId, disinfectionData, reciboFile, transaccionFile) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
            const vehicleSnap = await getDoc(vehicleRef);
            if (vehicleSnap.exists()) {
                const vehicle = vehicleSnap.data();
                
                // Subir archivos si existen
                const timestamp = Date.now();
                const reciboUrl = reciboFile ? await uploadFileToStorage(reciboFile, `recibos/${vehicleId}/${timestamp}_${reciboFile.name}`) : null;
                const transaccionUrl = transaccionFile ? await uploadFileToStorage(transaccionFile, `transacciones/${vehicleId}/${timestamp}_${transaccionFile.name}`) : null;

                const newDisinfection = {
                    fecha: Timestamp.fromDate(new Date(disinfectionData.fechaDesinfeccion + "T00:00:00")),
                    recibo: disinfectionData.numeroReciboPago,
                    urlRecibo: reciboUrl, // Guardar URL
                    nombreArchivoRecibo: reciboFile ? reciboFile.name : null,
                    transaccion: disinfectionData.numeroTransaccionPago, 
                    urlTransaccion: transaccionUrl, // Guardar URL
                    nombreArchivoTransaccion: transaccionFile ? transaccionFile.name : null,
                    montoPagado: parseFloat(disinfectionData.montoPagado) || 0, 
                    observaciones: disinfectionData.observaciones || '', 
                    registradoPor: currentUser.uid,
                    fechaRegistro: Timestamp.now()
                };
                const updatedHistorial = [newDisinfection, ...(vehicle.historialDesinfecciones || [])].sort((a,b) => b.fecha.toMillis() - a.fecha.toMillis());
                
                await updateDoc(vehicleRef, {
                    ultimaFechaDesinfeccion: newDisinfection.fecha,
                    ultimoReciboPago: newDisinfection.recibo,
                    ultimaUrlRecibo: newDisinfection.urlRecibo,
                    ultimaTransaccionPago: newDisinfection.transaccion,
                    ultimaUrlTransaccion: newDisinfection.urlTransaccion,
                    ultimoMontoPagado: newDisinfection.montoPagado,
                    ultimasObservaciones: newDisinfection.observaciones, 
                    historialDesinfecciones: updatedHistorial
                });
                setSelectedVehicleForApp(prev => ({ ...prev, ...newDisinfection, historialDesinfecciones: updatedHistorial }));
                showSnackbar("Desinfección registrada.", "success");
            } else showSnackbar("Vehículo no encontrado.", "error");
        } catch (e) { 
            console.error("Add Disinfection Error: ", e); 
            showSnackbar("Error al registrar desinfección: " + e.message, "error"); 
        }
        setLoading(false);
    };

    const handleDeleteDisinfection = async (vehicleId, index) => {
        if (!currentUser) { showSnackbar('Debe estar autenticado.', 'error'); return; }
        if (!window.confirm('¿Eliminar esta desinfección?')) return;
        setLoading(true);
        try {
            const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
            const snap = await getDoc(vehicleRef);
            if (snap.exists()) {
                const vehicle = snap.data();
                const historial = [...(vehicle.historialDesinfecciones || [])];
                historial.splice(index, 1);
                historial.sort((a,b) => b.fecha.toMillis() - a.fecha.toMillis());
                const last = historial[0] || null;
                await updateDoc(vehicleRef, {
                    historialDesinfecciones: historial,
                    ultimaFechaDesinfeccion: last ? last.fecha : null,
                    ultimoReciboPago: last ? last.recibo : null,
                    ultimaUrlRecibo: last ? last.urlRecibo : null,
                    ultimaTransaccionPago: last ? last.transaccion : null,
                    ultimaUrlTransaccion: last ? last.urlTransaccion : null,
                    ultimoMontoPagado: last ? last.montoPagado : null,
                    ultimasObservaciones: last ? last.observaciones : null
                });
                setSelectedVehicleForApp(prev => ({ ...prev, ...snap.data(), historialDesinfecciones: historial, ultimaFechaDesinfeccion: last ? last.fecha : null, ultimoReciboPago: last ? last.recibo : null, ultimaUrlRecibo: last ? last.urlRecibo : null, ultimaTransaccionPago: last ? last.transaccion : null, ultimaUrlTransaccion: last ? last.urlTransaccion : null, ultimoMontoPagado: last ? last.montoPagado : null, ultimasObservaciones: last ? last.observaciones : null }));
                showSnackbar('Desinfección eliminada.', 'success');
            } else showSnackbar('Vehículo no encontrado.', 'error');
        } catch (e) {
            console.error('Delete Disinfection Error:', e);
            showSnackbar('Error al eliminar desinfección: ' + e.message, 'error');
        }
        setLoading(false);
    };
    
    const navigate = (page, vehicleData = null) => {
        if (vehicleData) setSelectedVehicleForApp(vehicleData);
        setCurrentPage(page);
    };

    if (!isAuthReady) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}><CircularProgress /><Typography variant="h6" sx={{ mt: 2 }}>Cargando...</Typography></Box>;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> 
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="static" elevation={1}>
                    <Toolbar>
                        <img src={LOGO_SAN_ISIDRO_URL} alt="Logo San Isidro" style={{height: 36, marginRight: 16, filter: 'brightness(0) invert(1)'}} onError={(e) => e.target.style.display='none'}/>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Control de Desinfección Vehicular</Typography>
                        <Button color="inherit" onClick={() => navigate('home')} title="Inicio">Inicio</Button>
                        <Button color="inherit" onClick={() => navigate('dashboard')} startIcon={<BarChartIcon/>}>Dashboard</Button>
                        <Button color="inherit" onClick={() => navigate('admin')} startIcon={<SettingsIcon/>}>Admin</Button>
                        {currentUser && <Typography variant="caption" sx={{ml:2}}>ID: {currentUser.isAnonymous ? "Anónimo" : currentUser.uid.substring(0,6)}</Typography>}
                    </Toolbar>
                </AppBar>
                <Container component="main" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
                    {(loading || geminiLoading) && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1500 }}>
                           <Paper elevation={4} sx={{p:2, display:'flex', alignItems:'center', borderRadius:2}}> <CircularProgress size={24} sx={{mr:1}}/> <Typography>{geminiLoading ? "Procesando con IA..." : "Cargando..."}</Typography></Paper>
                        </Box>
                    )}
                    {currentPage === 'home' && <HomePage navigate={navigate} />}
                    {currentPage === 'register' && <VehicleForm onSubmit={handleRegisterVehicle} navigate={navigate} showSnackbar={showSnackbar} />}
                    {currentPage === 'admin' && <AdminPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearchVehicle} searchResults={searchResults} handleSelectVehicle={handleSelectVehicleForDetail} navigate={navigate} valorMetroCubico={valorMetroCubico} onUpdateValorMetroCubico={handleUpdateValorMetroCubico} />}
                    {currentPage === 'dashboard' && <DashboardPage vehicles={allVehiclesForDashboard} />}
                    {currentPage === 'vehicleDetail' && selectedVehicleForApp && <VehicleDetailPage vehicle={selectedVehicleForApp} onAddDisinfection={handleAddDisinfection} onDeleteDisinfection={handleDeleteDisinfection} navigate={navigate} showSnackbar={showSnackbar} onOpenPaymentPage={() => setOpenPaymentModal(true)} valorMetroCubico={valorMetroCubico} setGeminiLoading={setGeminiLoading} />}
                    {currentPage === 'credential' && selectedVehicleForApp && <DigitalCredential vehicle={selectedVehicleForApp} navigate={navigate} showSnackbar={showSnackbar} />}
                </Container>
                <Box component="footer" sx={{ bgcolor: 'background.paper', p: 3, borderTop: `1px solid ${theme.palette.divider}` }}><Typography variant="body2" color="text.secondary" align="center">&copy; {new Date().getFullYear()} Municipalidad de San Isidro</Typography></Box>
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert></Snackbar>
                <Modal open={openPaymentModal} onClose={() => setOpenPaymentModal(false)}><Box sx={{position: 'absolute',top: '50%',left: '50%',transform: 'translate(-50%, -50%)',width: '90%',maxWidth: '800px',height: '80vh',bgcolor: 'background.paper',border: '2px solid #000',boxShadow: 24,p: 0,display: 'flex',flexDirection: 'column',borderRadius: 2,overflow: 'hidden',}}><Box sx={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',p:1.5,borderBottom: `1px solid ${theme.palette.divider}`,backgroundColor: theme.palette.primary.main,color: 'white'}}><Typography variant="h6">Generar Boleta</Typography><IconButton onClick={() => setOpenPaymentModal(false)} color="inherit" size="small"><CloseIcon /></IconButton></Box><iframe src="https://boletadepago.gestionmsi.gob.ar/siste" title="Generador Boleta MSI" style={{ width: '100%', height: '100%', border: 'none', flexGrow: 1 }}/></Box></Modal>
            </Box>
        </ThemeProvider>
    );
}

const HomePage = ({ navigate }) => ( 
    <StyledPaper sx={{ textAlign: 'center', mt: 4, p: 4 }}>
        <img src={LOGO_SAN_ISIDRO_URL} alt="Logo Municipalidad de San Isidro" style={{ maxWidth: '250px', marginBottom: theme.spacing(3) }} onError={(e) => e.target.style.display='none'}/>
        <Typography variant="h4" component="h1" gutterBottom color="primary.dark">
            Sistema de Control de Desinfección Vehicular
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{mb:4}}>
            Dirección de Control de Vectores - Municipalidad de San Isidro
        </Typography>
        <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
                <Button fullWidth variant="contained" color="primary" size="large" startIcon={<AddCircleIcon />} onClick={() => navigate('register')} sx={{ py: 1.5 }}>
                    Registrar Vehículo
                </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Button fullWidth variant="contained" color="secondary" size="large" startIcon={<SettingsIcon />} onClick={() => navigate('admin')} sx={{ py: 1.5 }}>
                    Administrar
                </Button>
            </Grid>
             <Grid item xs={12} sm={6} md={4}>
                <Button fullWidth variant="outlined" color="primary" size="large" startIcon={<BarChartIcon />} onClick={() => navigate('dashboard')} sx={{ py: 1.5 }}>
                    Dashboard
                </Button>
            </Grid>
        </Grid>
    </StyledPaper>
);

const VehicleForm = ({ onSubmit, navigate, showSnackbar, initialData = {} }) => { 
    const [formData, setFormData] = useState({
        patente: initialData.patente || '',
        marca: initialData.marca || '',
        tipoVehiculo: initialData.tipoVehiculo || TIPOS_VEHICULO[0],
        largo: initialData.largo || '', 
        ancho: initialData.ancho || '', 
        altura: initialData.altura || '', 
        metrosCubicos: initialData.metrosCubicos || '0.00', 
        propietarioNombre: initialData.propietarioNombre || '',
        emailPropietario: initialData.emailPropietario || '',
        numeroVehiculoMunicipal: initialData.numeroVehiculoMunicipal || '',
    });

    useEffect(() => {
        const largoNum = parseFloat(formData.largo);
        const anchoNum = parseFloat(formData.ancho);
        const alturaNum = parseFloat(formData.altura);

        if (!isNaN(largoNum) && !isNaN(anchoNum) && !isNaN(alturaNum) && largoNum > 0 && anchoNum > 0 && alturaNum > 0) {
            const m3 = (largoNum * anchoNum * alturaNum).toFixed(2);
            setFormData(prev => ({ ...prev, metrosCubicos: m3 }));
        } else {
            setFormData(prev => ({ ...prev, metrosCubicos: '0.00' }));
        }
    }, [formData.largo, formData.ancho, formData.altura]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'patente' || name === 'marca') {
            processedValue = value.toUpperCase();
        } else if (['largo', 'ancho', 'altura'].includes(name)) {
            processedValue = value.replace(/[^0-9.]/g, '');
            const parts = processedValue.split('.');
            if (parts.length > 2) {
                processedValue = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const m3Calculados = parseFloat(formData.metrosCubicos);
        if (!formData.patente || !formData.marca || !formData.tipoVehiculo || !formData.propietarioNombre ||
            !formData.emailPropietario || !formData.largo || !formData.ancho || !formData.altura ) {
            showSnackbar("Todos los campos marcados con * son obligatorios (incluyendo dimensiones).", "error");
            return;
        }
        if (isNaN(m3Calculados) || m3Calculados <= 0) {
            showSnackbar("Las dimensiones ingresadas no resultan en metros cúbicos válidos. Verifique largo, ancho y altura.", "error");
            return;
        }
        onSubmit(formData);
    };

    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('home')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" sx={{ ml: 1 }} color="primary.dark">Registrar Vehículo</Typography>
            </Box>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                <TextField margin="normal" required fullWidth id="patente" label="Patente (Ej: AA123BB)" name="patente" value={formData.patente} onChange={handleChange} inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }} InputProps={{ startAdornment: <ReceiptIcon sx={{mr:1, color:'action.active'}}/> }} />
                <TextField margin="normal" required fullWidth id="marca" label="Marca" name="marca" value={formData.marca} onChange={handleChange} InputProps={{ startAdornment: <DirectionsCarIcon sx={{mr:1, color:'action.active'}}/> }} />
                <FormControl fullWidth margin="normal" required>
                    <InputLabel id="tipoVehiculo-label">Tipo de Vehículo *</InputLabel>
                    <Select labelId="tipoVehiculo-label" id="tipoVehiculo" name="tipoVehiculo" value={formData.tipoVehiculo} label="Tipo de Vehículo *" onChange={handleChange}>
                        {TIPOS_VEHICULO.map((tipo) => (
                            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="normal" required fullWidth id="largo" label="Largo (m)" name="largo" type="text" value={formData.largo} onChange={handleChange} InputProps={{ startAdornment: <StraightenIcon sx={{mr:1, color:'action.active', transform: 'rotate(90deg)'}}/> }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="normal" required fullWidth id="ancho" label="Ancho (m)" name="ancho" type="text" value={formData.ancho} onChange={handleChange} InputProps={{ startAdornment: <StraightenIcon sx={{mr:1, color:'action.active'}}/> }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField margin="normal" required fullWidth id="altura" label="Altura (m)" name="altura" type="text" value={formData.altura} onChange={handleChange} InputProps={{ startAdornment: <StraightenIcon sx={{mr:1, color:'action.active'}}/> }} />
                    </Grid>
                </Grid>
                <MuiTooltip title="Calculado automáticamente (Largo x Ancho x Altura)">
                    <TextField margin="normal" required fullWidth id="metrosCubicos" label="Metros Cúbicos (m³)" name="metrosCubicos" type="text" value={formData.metrosCubicos} InputProps={{ readOnly: true, startAdornment: <DirectionsCarIcon sx={{mr:1, color:'action.active'}}/> }} sx={{backgroundColor: theme.palette.grey[100]}} />
                </MuiTooltip>
                <TextField margin="normal" required fullWidth id="propietarioNombre" label="Nombre del Propietario" name="propietarioNombre" value={formData.propietarioNombre} onChange={handleChange} InputProps={{ startAdornment: <PersonIcon sx={{mr:1, color:'action.active'}}/> }}/>
                <TextField margin="normal" required fullWidth id="emailPropietario" label="Email del Propietario" name="emailPropietario" type="email" value={formData.emailPropietario} onChange={handleChange} InputProps={{ startAdornment: <EmailIcon sx={{mr:1, color:'action.active'}}/> }}/>
                <TextField margin="normal" fullWidth id="numeroVehiculoMunicipal" label="Número de Vehículo Municipal (Opcional)" name="numeroVehiculoMunicipal" value={formData.numeroVehiculoMunicipal} onChange={handleChange} InputProps={{ startAdornment: <DirectionsCarIcon sx={{mr:1, color:'action.active'}}/> }}/>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.2 }}>Registrar Vehículo</Button>
            </Box>
        </StyledPaper>
    );
};

const AdminPage = ({ searchTerm, setSearchTerm, handleSearch, searchResults, handleSelectVehicle, navigate, valorMetroCubico, onUpdateValorMetroCubico }) => { 
    const [nuevoValorM3, setNuevoValorM3] = useState(valorMetroCubico);

    useEffect(() => {
        setNuevoValorM3(valorMetroCubico); 
    }, [valorMetroCubico]);

    const handleValorM3Change = (e) => {
        setNuevoValorM3(e.target.value);
    };

    const handleSaveValorM3 = () => {
        onUpdateValorMetroCubico(nuevoValorM3);
    };
    
    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('home')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" sx={{ ml: 1 }} color="primary.dark">Administración</Typography>
            </Box>

            <Accordion sx={{mb:3}}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-config-content" id="panel-config-header">
                    <SettingsIcon sx={{mr:1, color:'action.active'}}/> <Typography>Configuración de Precios</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="Valor Fijo por m³ ($)"
                            type="number"
                            value={nuevoValorM3}
                            onChange={handleValorM3Change}
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{minWidth: '200px'}}
                        />
                        <Button variant="contained" onClick={handleSaveValorM3} startIcon={<PriceChangeIcon/>}>Actualizar Valor</Button>
                    </Box>
                     <Typography variant="caption" display="block" sx={{mt:1}}>Este valor se usa para calcular el monto estimado de desinfección.</Typography>
                </AccordionDetails>
            </Accordion>
            
            <Typography variant="h6" gutterBottom color="primary.dark">Buscar Vehículos</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TextField fullWidth variant="outlined" label="Buscar por Patente (Ej: AA123BB)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} sx={{ mr: 1 }} inputProps={{ style: { textTransform: 'uppercase' } }}/>
                <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />} sx={{height: '56px'}}>Buscar</Button>
            </Box>
            {searchResults.length > 0 ? (
                <List>
                    {searchResults.map(vehicle => (
                        <ListItem key={vehicle.id} divider secondaryAction={ <Button variant="outlined" size="small" onClick={() => handleSelectVehicle(vehicle.id)}>Ver Detalles</Button> } sx={{ '&:hover': { backgroundColor: '#f5f5f5' }, borderRadius: 1, mb: 0.5 }}>
                            <ListItemText primary={<Typography variant="subtitle1" color="primary">{vehicle.patente}</Typography>} secondary={`${vehicle.marca} - ${vehicle.tipoVehiculo} - ${vehicle.propietarioNombre}`} />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography sx={{ textAlign: 'center', mt: 3, fontStyle: 'italic' }} color="text.secondary">No hay vehículos para mostrar. Realice una búsqueda o registre nuevos vehículos.</Typography>
            )}
        </StyledPaper>
    );
};

const VehicleDetailPage = ({ vehicle, onAddDisinfection, onDeleteDisinfection, navigate, showSnackbar, onOpenPaymentPage, valorMetroCubico, setGeminiLoading }) => {
    const [showAddDisinfectionForm, setShowAddDisinfectionForm] = useState(false);
    const [disinfectionDate, setDisinfectionDate] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [transactionNumber, setTransactionNumber] = useState(''); 
    const [amountPaid, setAmountPaid] = useState(''); 
    const [observacionesPuntosClave, setObservacionesPuntosClave] = useState(''); 
    const [observacionesGeneradas, setObservacionesGeneradas] = useState(''); 
    const [reciboFile, setReciboFile] = useState(null); // Para la foto del recibo
    const [transaccionFile, setTransaccionFile] = useState(null); // Para la foto de la transacción
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [disinfectionDataToSubmit, setDisinfectionDataToSubmit] = useState(null);
    const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
    const [historySummary, setHistorySummary] = useState('');

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
            // Pasar los archivos a onAddDisinfection
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
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return timestamp.toDate().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton onClick={() => navigate('admin')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" color="primary.dark" sx={{ml:1}}>Detalles del Vehículo</Typography>
            </Box>
            <Typography variant="h6" gutterBottom sx={{color: theme.palette.primary.light, fontWeight: 'medium'}}>{vehicle.patente}</Typography>

            <Paper elevation={0} sx={{ my: 2, p:2, backgroundColor: '#fafafa', borderRadius:1.5 }}>
                <Typography><strong>Marca:</strong> {vehicle.marca}</Typography>
                <Typography><strong>Tipo:</strong> {vehicle.tipoVehiculo || 'N/A'}</Typography>
                <Typography><strong>Dimensiones:</strong> L: {vehicle.largo || 'N/A'}m, An: {vehicle.ancho || 'N/A'}m, Al: {vehicle.altura || 'N/A'}m</Typography>
                <Typography><strong>Metros Cúbicos:</strong> {parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³</Typography>
                <Typography><strong>Propietario:</strong> {vehicle.propietarioNombre}</Typography>
                <Typography><strong>Email:</strong> {vehicle.emailPropietario || 'N/A'}</Typography>
                <Typography><strong>Nº Vehículo Municipal:</strong> {vehicle.numeroVehiculoMunicipal || 'N/A'}</Typography>
                <Divider sx={{my:1}}/>
                <Typography><strong>Última Desinfección:</strong> <span style={{ fontWeight: 'bold', color: vehicle.ultimaFechaDesinfeccion ? theme.palette.success.dark : theme.palette.warning.dark }}>{formatDate(vehicle.ultimaFechaDesinfeccion)}</span></Typography>
                <Typography><strong>Último Recibo:</strong> {vehicle.ultimoReciboPago || 'N/A'} {vehicle.ultimaUrlRecibo && <Button size="small" href={vehicle.ultimaUrlRecibo} target="_blank" rel="noopener noreferrer">Ver Foto</Button>}</Typography>
                <Typography><strong>Última Transacción:</strong> {vehicle.ultimaTransaccionPago || 'N/A'} {vehicle.ultimaUrlTransaccion && <Button size="small" href={vehicle.ultimaUrlTransaccion} target="_blank" rel="noopener noreferrer">Ver Foto</Button>}</Typography>
                <Typography><strong>Último Monto Pagado:</strong> $ {vehicle.ultimoMontoPagado ? parseFloat(vehicle.ultimoMontoPagado).toFixed(2) : 'N/A'}</Typography>
                <Typography><strong>Últimas Observaciones:</strong> {vehicle.ultimasObservaciones || 'N/A'}</Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
                <Button variant="contained" color="secondary" startIcon={<AddCircleIcon />} onClick={() => setShowAddDisinfectionForm(!showAddDisinfectionForm)}>
                    {showAddDisinfectionForm ? 'Cancelar Registro' : 'Registrar Desinfección'}
                </Button>
                <Button variant="outlined" color="primary" startIcon={<PaymentIcon />} onClick={onOpenPaymentPage}>
                    Generar Boleta de Pago
                </Button>
                 <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => navigate('credential', vehicle)}>
                    Ver Credencial
                </Button>
                <Button variant="outlined" color="info" startIcon={<AutoAwesomeIcon />} onClick={handleGenerateHistorySummary}>
                    ✨ Resumir Historial (IA)
                </Button>
            </Box>

            {showAddDisinfectionForm && (
                <Paper component="form" onSubmit={handleOpenConfirmDialog} sx={{ p: 2.5, mt: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1.5 }} elevation={2}>
                    <Typography variant="h6" gutterBottom color="secondary.dark">Nueva Desinfección</Typography>
                    <Typography variant="subtitle1" gutterBottom>Monto Estimado a Pagar: <strong>${montoEstimado}</strong></Typography>
                    <TextField type="date" label="Fecha de Desinfección" value={disinfectionDate} onChange={(e) => setDisinfectionDate(e.target.value)} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required />
                    
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={8}>
                           <TextField label="Número de Recibo de Pago (MSI)" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} fullWidth margin="normal" required />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />} sx={{mt: {xs:0, sm:1}}}>
                                Foto Recibo
                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setReciboFile)} />
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
                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setTransaccionFile)} />
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

            <Typography variant="h6" sx={{ mt: 3, mb: 1 }} color="primary.dark">Historial de Desinfecciones</Typography>
            {vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0 ? (
                <Paper elevation={0} sx={{maxHeight: 220, overflow: 'auto', backgroundColor: theme.palette.grey[100], borderRadius:1.5, p:1}}>
                    <List dense >
                        {vehicle.historialDesinfecciones.map((item, index) => (
                            <ListItem key={index} divider sx={{py: 0.5}} secondaryAction={
                                <IconButton edge="end" color="error" onClick={() => onDeleteDisinfection(vehicle.id, index)}>
                                    <DeleteIcon />
                                </IconButton>
                            }>
                                <ListItemText
                                    primary={`Fecha: ${formatDate(item.fecha)}`}
                                    secondary={
                                        <>
                                        Recibo: {item.recibo} {item.urlRecibo && <Button size="small" sx={{ml:1,p:0.2}} href={item.urlRecibo} target="_blank">Ver</Button>} | 
                                        Trans.: {item.transaccion || 'N/A'} {item.urlTransaccion && <Button size="small" sx={{ml:1,p:0.2}} href={item.urlTransaccion} target="_blank">Ver</Button>} | 
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
        </StyledPaper>
    );
};

const DigitalCredential = ({ vehicle, navigate, showSnackbar }) => { 
    const formatDate = (timestamp) => {
        if (!timestamp) return 'PENDIENTE';
        return timestamp.toDate().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const createPDF = () => {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error("jsPDF no está cargado globalmente.");
            showSnackbar("Error al generar PDF: la librería jsPDF no está disponible.", "error");
            return null;
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        
        const primaryColor = theme.palette.primary.dark; 
        const textColor = '#333333';
        const lightTextColor = '#555555';
        const accentColor = theme.palette.secondary.main;

        try { pdf.setFont('Plus Jakarta Sans', 'normal'); } catch (e) { pdf.setFont('helvetica', 'normal'); }

        pdf.setFontSize(20); pdf.setTextColor(primaryColor); pdf.setFontType('bold');
        pdf.text("CREDENCIAL DE DESINFECCIÓN VEHICULAR", pdf.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
        
        pdf.setFontSize(12); pdf.setTextColor(textColor); pdf.setFontType('normal');
        pdf.text("Municipalidad de San Isidro - Dirección de Control de Vectores", pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

        let yPos = 130; const lineHeight = 22; const sectionSpacing = 20; const leftMargin = 40; const valueOffset = 180; 

        const addField = (label, value, isImportant = false) => {
            pdf.setFontType('bold'); pdf.setTextColor(textColor); pdf.text(label, leftMargin, yPos);
            pdf.setFontType('normal'); pdf.setTextColor(isImportant ? accentColor : lightTextColor);
            pdf.text(String(value || 'N/A'), leftMargin + valueOffset, yPos);
            yPos += lineHeight;
        };
        
        pdf.setFontSize(14); pdf.setFontType('bold'); pdf.setTextColor(primaryColor);
        pdf.text("Datos del Vehículo:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(11);

        addField("Patente:", vehicle.patente, true);
        addField("Marca:", vehicle.marca);
        addField("Tipo:", vehicle.tipoVehiculo || 'N/A');
        addField("Dimensiones:", `L:${vehicle.largo || 'N/A'} An:${vehicle.ancho || 'N/A'} Al:${vehicle.altura || 'N/A'} (m)`);
        addField("Metros Cúbicos:", `${parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³`);
        addField("Propietario:", vehicle.propietarioNombre);
        addField("Email:", vehicle.emailPropietario || 'N/A');
        addField("Nº Vehículo Municipal:", vehicle.numeroVehiculoMunicipal || 'N/A');
        
        yPos += sectionSpacing; pdf.setFontSize(14); pdf.setFontType('bold'); pdf.setTextColor(primaryColor);
        pdf.text("Última Desinfección:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(11);

        addField("Fecha:", formatDate(vehicle.ultimaFechaDesinfeccion), true);
        addField("Recibo (MSI):", vehicle.ultimoReciboPago || 'N/A');
        // Podríamos añadir un texto si hay URL de foto, ej: "(Foto adjunta)"
        if (vehicle.ultimaUrlRecibo) addField("Foto Recibo:", "Adjunta (Ver sistema)");
        addField("Transacción:", vehicle.ultimaTransaccionPago || 'N/A');
        if (vehicle.ultimaUrlTransaccion) addField("Foto Trans.:", "Adjunta (Ver sistema)");
        addField("Monto Pagado:", vehicle.ultimoMontoPagado ? `$${parseFloat(vehicle.ultimoMontoPagado).toFixed(2)}` : 'N/A');
        addField("Observaciones:", vehicle.ultimasObservaciones || 'N/A');


        yPos += sectionSpacing; pdf.setFontSize(14); pdf.setFontType('bold'); pdf.setTextColor(primaryColor);
        pdf.text("Historial de Desinfecciones:", leftMargin, yPos); yPos += lineHeight + (sectionSpacing / 2); pdf.setFontSize(10); pdf.setTextColor(lightTextColor);

        if (vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0) {
            vehicle.historialDesinfecciones.forEach((item) => {
                if (yPos > pdf.internal.pageSize.getHeight() - 90) {  
                    pdf.addPage(); yPos = 40;
                    pdf.setFontSize(14);pdf.setFontType('bold');pdf.setTextColor(primaryColor);
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

        return pdf;
    };

    const generatePDF = async () => {
        const pdf = createPDF();
        if (pdf) pdf.save(`credencial_${vehicle.patente}.pdf`);
    };

    const getPDFBase64 = async () => {
        const pdf = createPDF();
        return pdf ? pdf.output('datauristring').split(',')[1] : null;
    };

    const handleSendEmail = async () => {
        try {
            const base64 = await getPDFBase64();
            if (!base64) return;
            const resp = await fetch('http://localhost:4000/send-credential', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: vehicle.emailPropietario,
                    subject: `Credencial Vehículo ${vehicle.patente}`,
                    pdfBase64: base64
                })
            });
            if (!resp.ok) throw new Error('Error HTTP');
            showSnackbar('Credencial enviada por email.', 'success');
        } catch (e) {
            console.error('Send email error:', e);
            showSnackbar('Error al enviar email: ' + e.message, 'error');
        }
    };

    return (
        <StyledPaper>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: -1, ml: -1 }}>
                <IconButton onClick={() => navigate(vehicle.createdBy ? 'admin' : 'home')} ><ArrowBackIcon /></IconButton>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3, borderBottom: `2px solid ${theme.palette.primary.main}`, pb: 2 }}>
                <img src={LOGO_SAN_ISIDRO_URL} alt="Logo San Isidro" style={{height: 50, marginBottom: theme.spacing(1)}} onError={(e) => e.target.style.display='none'}/>
                <Typography variant="h4" component="h2" color="primary.dark" gutterBottom>CREDENCIAL DE DESINFECCIÓN</Typography>
                <Typography variant="subtitle1" color="text.secondary">Municipalidad de San Isidro - Dirección de Control de Vectores</Typography>
            </Box>

            <Accordion defaultExpanded sx={{mb:2, boxShadow: 'none', '&:before': {display: 'none'} }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{backgroundColor: theme.palette.primary.lighter+'33', borderRadius:1}}>
                    <DirectionsCarIcon sx={{mr:1, color: 'primary.main'}} /> <Typography variant="h6" color="primary.dark">Datos del Vehículo</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{pt:1.5}}>
                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}><Typography component="div"><strong>Patente:</strong> <MuiChip label={vehicle.patente} size="small" color="primary" /></Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Marca:</strong> {vehicle.marca}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Tipo:</strong> {vehicle.tipoVehiculo || 'N/A'}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Dimensiones:</strong> L: {vehicle.largo || 'N/A'}m, An: {vehicle.ancho || 'N/A'}m, Al: {vehicle.altura || 'N/A'}m</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Metros Cúbicos:</strong> {parseFloat(vehicle.metrosCubicos).toFixed(2) || 'N/A'} m³</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Propietario:</strong> {vehicle.propietarioNombre}</Typography></Grid>
                        <Grid item xs={12} sm={6}><Typography><strong>Email:</strong> {vehicle.emailPropietario || 'N/A'}</Typography></Grid>
                        <Grid item xs={12}><Typography><strong>Nº Vehículo Municipal:</strong> {vehicle.numeroVehiculoMunicipal || 'N/A'}</Typography></Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
            
            <Accordion defaultExpanded sx={{mb:2, boxShadow: 'none', '&:before': {display: 'none'} }}>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{backgroundColor: (vehicle.ultimaFechaDesinfeccion ? theme.palette.success.lighter : theme.palette.warning.lighter)+'33', borderRadius:1}}>
                    <VerifiedUserIcon sx={{mr:1, color: vehicle.ultimaFechaDesinfeccion ? 'success.main' : 'warning.main' }} /> <Typography variant="h6" color={vehicle.ultimaFechaDesinfeccion ? 'success.dark' : 'warning.dark'}>Última Desinfección</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{pt:1.5}}>
                    <Typography variant="body1"><strong>Fecha:</strong> <span style={{ fontWeight: 'bold', color: vehicle.ultimaFechaDesinfeccion ? theme.palette.success.dark : theme.palette.warning.dark }}>{formatDate(vehicle.ultimaFechaDesinfeccion)}</span></Typography>
                    <Typography variant="body1"><strong>Recibo (MSI):</strong> {vehicle.ultimoReciboPago || 'N/A'} {vehicle.ultimaUrlRecibo && <Button size="small" href={vehicle.ultimaUrlRecibo} target="_blank" rel="noopener noreferrer">(Ver Foto)</Button>}</Typography>
                    <Typography variant="body1"><strong>Nº Transacción:</strong> {vehicle.ultimaTransaccionPago || 'N/A'} {vehicle.ultimaUrlTransaccion && <Button size="small" href={vehicle.ultimaUrlTransaccion} target="_blank" rel="noopener noreferrer">(Ver Foto)</Button>}</Typography>
                    <Typography variant="body1"><strong>Monto Pagado:</strong> {vehicle.ultimoMontoPagado ? `$${parseFloat(vehicle.ultimoMontoPagado).toFixed(2)}` : 'N/A'}</Typography>
                    <Typography variant="body1"><strong>Observaciones:</strong> {vehicle.ultimasObservaciones || 'N/A'}</Typography>
                </AccordionDetails>
            </Accordion>

            <Accordion sx={{boxShadow: 'none', '&:before': {display: 'none'} }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{backgroundColor: theme.palette.grey[100], borderRadius:1}}>
                    <CalendarTodayIcon sx={{mr:1, color: 'action.active'}} /> <Typography variant="h6" color="text.secondary">Historial de Desinfecciones</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{pt:1.5}}>
                    {vehicle.historialDesinfecciones && vehicle.historialDesinfecciones.length > 0 ? (
                        <List dense sx={{maxHeight: 200, overflow: 'auto', p:0}}>
                            {vehicle.historialDesinfecciones.map((item, index) => (
                                <ListItem key={index} divider sx={{py: 0.5}}>
                                    <ListItemText 
                                        primary={`Fecha: ${formatDate(item.fecha)}`} 
                                        secondary={
                                            <>
                                            Recibo: {item.recibo} {item.urlRecibo && <Button size="small" sx={{ml:0.5, p:0.1}} href={item.urlRecibo} target="_blank">(F)</Button>} | 
                                            Trans.: {item.transaccion || 'N/A'} {item.urlTransaccion && <Button size="small" sx={{ml:0.5, p:0.1}} href={item.urlTransaccion} target="_blank">(F)</Button>} | 
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
                </AccordionDetails>
            </Accordion>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                ID Credencial (Vehículo): {vehicle.id}
            </Typography>
            <Button fullWidth variant="contained" color="error" startIcon={<DownloadIcon />} onClick={generatePDF} sx={{ mt: 3, py: 1.2 }}>
                Descargar Credencial en PDF
            </Button>
            <Button fullWidth variant="contained" color="primary" startIcon={<EmailIcon />} onClick={handleSendEmail} sx={{ mt: 2, py: 1.2 }}>
                Enviar por Email
            </Button>
        </StyledPaper>
    );
};

const DashboardPage = ({ vehicles }) => { 
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const desinfeccionesMesActual = useMemo(() => {
        return vehicles.reduce((acc, vehicle) => {
            const historial = vehicle.historialDesinfecciones || [];
            historial.forEach(desinf => {
                if (desinf.fecha && typeof desinf.fecha.toDate === 'function') { 
                    const fechaDesinf = desinf.fecha.toDate();
                    if (fechaDesinf.getMonth() === currentMonth && fechaDesinf.getFullYear() === currentYear) {
                        acc.push({ ...desinf, tipoVehiculo: vehicle.tipoVehiculo, patente: vehicle.patente });
                    }
                }
            });
            return acc;
        }, []);
    }, [vehicles, currentMonth, currentYear]);

    const vehiculosDesinfectadosEsteMes = desinfeccionesMesActual.length;

    const desinfeccionesPorTipo = useMemo(() => {
        const counts = {};
        desinfeccionesMesActual.forEach(desinf => {
            const tipo = desinf.tipoVehiculo || "No especificado";
            counts[tipo] = (counts[tipo] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [desinfeccionesMesActual]);

    const montoTotalRecaudadoMes = useMemo(() => {
        return desinfeccionesMesActual.reduce((sum, desinf) => sum + (parseFloat(desinf.montoPagado) || 0), 0);
    }, [desinfeccionesMesActual]);
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#8884D8', '#FF6347', '#32CD32'];

    return (
        <StyledPaper>
            <Typography variant="h4" component="h1" gutterBottom color="primary.dark" sx={{textAlign: 'center', mb:3}}>
                Dashboard de Desinfecciones
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.primary.lighter+'22', height: '100%' }}>
                        <Typography variant="h6" color="primary.dark">Desinfecciones este Mes</Typography>
                        <Typography variant="h3" color="primary.main" sx={{fontWeight: 'bold'}}>{vehiculosDesinfectadosEsteMes}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                     <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.secondary.lighter+'22', height: '100%' }}>
                        <Typography variant="h6" color="secondary.dark">Recaudación del Mes</Typography>
                        <Typography variant="h3" color="secondary.main" sx={{fontWeight: 'bold'}}>${montoTotalRecaudadoMes.toFixed(2)}</Typography>
                    </Paper>
                </Grid>
                 <Grid item xs={12} md={4}>
                     <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.accent.main+'22', height: '100%' }}>
                        <Typography variant="h6" style={{color: theme.palette.accent.dark || theme.palette.accent.main}}>Vehículos Registrados</Typography>
                        <Typography variant="h3" style={{color: theme.palette.accent.main, fontWeight: 'bold'}}>{vehicles.length}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={desinfeccionesPorTipo.length > 0 ? 7 : 12}>
                    <Paper elevation={2} sx={{p:2, mt:2}}>
                    <Typography variant="h6" gutterBottom sx={{mt:2, textAlign:'center'}}>Desinfecciones por Tipo de Vehículo (Mes Actual)</Typography>
                    {desinfeccionesPorTipo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={desinfeccionesPorTipo} margin={{ top: 5, right: 10, left: -20, bottom: 55 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-40} textAnchor="end" interval={0} style={{fontSize: '0.8rem'}}/>
                                <YAxis allowDecimals={false}/>
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill={theme.palette.secondary.main} name="Cantidad" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Typography sx={{textAlign:'center', fontStyle:'italic', mt:3}}>No hay datos de desinfecciones por tipo este mes.</Typography>
                    )}
                    </Paper>
                </Grid>
                 {desinfeccionesPorTipo.length > 0 && (
                    <Grid item xs={12} md={5}>
                        <Paper elevation={2} sx={{p:2, mt:2}}>
                        <Typography variant="h6" gutterBottom sx={{mt:2, textAlign:'center'}}>Distribución por Tipo</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={desinfeccionesPorTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                    {desinfeccionesPorTipo.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </StyledPaper>
    );
};

export default App;
