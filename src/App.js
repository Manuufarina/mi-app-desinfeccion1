/* global __app_id */ // __initial_auth_token is handled by useAuth
import React, { useState, useEffect, useMemo } from 'react';
// Firebase specific auth functions (signInAnonymously, etc.) are in useAuth.
// auth instance is also used by useAuth.
import { Timestamp } from 'firebase/firestore'; // Timestamp is used in App.js

// Import Hooks
import { useSnackbar } from './hooks/useSnackbar';
import { useAuth } from './hooks/useAuth';

// Import services
import { 
    handleUpdateValorMetroCubico as updateValorMetroCubicoService,
    fetchInitialConfig as fetchInitialConfigService,
    fetchAllVehicles as fetchAllVehiclesService,
    handleRegisterVehicle as registerVehicleService,
    handleSelectVehicleForDetail as selectVehicleForDetailService,
    handleAddDisinfection as addDisinfectionService,
    handleUpdateVehicle as updateVehicleService,
    handleDeleteVehicle as deleteVehicleService,
    handleUpdateDisinfection as updateDisinfectionService,
    handleDeleteDisinfection as deleteDisinfectionService,
    addAdminUser as addAdminUserService,
    fetchAdminUsers as fetchAdminUsersService
    // uploadFileToStorage is used by addDisinfectionService, not directly here
} from './services/firestoreService';

// Material-UI Components
import {
    Container, AppBar, Toolbar, Typography, Button, TextField, Box, Paper, Grid,
    CircularProgress, Alert, Snackbar, IconButton, List, ListItem, ListItemText, // Snackbar for UI
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Accordion, AccordionSummary, AccordionDetails, Chip as MuiChip,
    Modal, Select, MenuItem, FormControl, InputLabel, InputAdornment, Tooltip as MuiTooltip,
    Divider, Drawer, ListItemButton, useMediaQuery
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles'; // createTheme, styled moved to theme/index.js
import CssBaseline from '@mui/material/CssBaseline';

// Theme and constant imports
import { theme, LOGO_SAN_ISIDRO_URL, VALOR_METRO_CUBICO_DEFAULT } from './theme'; // Removed StyledPaper
// TIPOS_VEHICULO is not used directly in App.js anymore, but in VehicleForm.js

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
import MenuIcon from '@mui/icons-material/Menu';

// Recharts
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// Moved to DashboardPage.js

// Component Imports
import HomePage from './components/pages/HomePage';
import VehicleForm from './components/pages/VehicleForm';
import AdminPage from './components/pages/AdminPage';
import VehicleDetailPage from './components/pages/VehicleDetailPage';
import DigitalCredential from './components/pages/DigitalCredential';
import DashboardPage from './components/pages/DashboardPage';
import SearchDisinfectionPage from './components/pages/SearchDisinfectionPage';
import LoginPage from './components/pages/LoginPage';

// const LOGO_SAN_ISIDRO_URL = "https://www.sanisidro.gob.ar/sites/default/files/logo_san_isidro_horizontal_blanco_web_1.png"; // Moved to theme

// Firebase app, db, storage are initialized in services/firebase.js
// const firebaseConfig = JSON.parse(firebaseConfigString); // In firebase.js
// const app = initializeApp(firebaseConfig); // In firebase.js
// const auth = getAuth(app); // Imported from firebase.js
// const db = getFirestore(app); // In firebase.js, used by firestoreService.js
// const storage = getStorage(app); // In firebase.js, used by firestoreService.js

const appId = typeof __app_id !== 'undefined' && __app_id
  ? __app_id
  : 'desinfeccion-vehicular-msi-app';

// Color constants (sanIsidroGreen, etc.) moved to theme/index.js
// theme object creation moved to theme/index.js
// StyledPaper moved to theme/index.js
// TIPOS_VEHICULO moved to theme/index.js
// VALOR_METRO_CUBICO_DEFAULT imported from theme/index.js

// GEMINI_API_KEY and callGeminiAPI are now in services/geminiService.js

function App() {
    const { snackbar, showSnackbar, handleCloseSnackbar } = useSnackbar();
    const { currentUser, isAuthReady } = useAuth(); // useAuth now uses useSnackbar internally for its own errors

    const [currentPage, setCurrentPage] = useState('home');
    // const [currentUser, setCurrentUser] = useState(null); // from useAuth
    // const [isAuthReady, setIsAuthReady] = useState(false); // from useAuth
    const [selectedVehicleForApp, setSelectedVehicleForApp] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipoVehiculo, setFilterTipoVehiculo] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allVehiclesForDashboard, setAllVehiclesForDashboard] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // from useSnackbar
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const [valorMetroCubico, setValorMetroCubico] = useState(VALOR_METRO_CUBICO_DEFAULT);
    const [configDocId, setConfigDocId] = useState(null);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [autoOpenAddForm, setAutoOpenAddForm] = useState(false);
    const [guestView, setGuestView] = useState(false);
    const [adminLoggedIn, setAdminLoggedIn] = useState(() =>
        localStorage.getItem('adminLoggedIn') === 'true'
    );
    const [adminUsers, setAdminUsers] = useState([]);

    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const toggleDrawer = (open) => () => {
        setDrawerOpen(open);
    };

    const handleAdminLogin = (username, password) => {
        const match = adminUsers.find(u => u.username === username && u.password === password);
        if (username === 'admin' && password === 'vectores2025' || match) {
            setAdminLoggedIn(true);
            localStorage.setItem('adminLoggedIn', 'true');
            showSnackbar('Inicio de sesi\u00f3n exitoso', 'success');
            setCurrentPage('home');
        } else {
            showSnackbar('Credenciales inv\u00e1lidas', 'error');
        }
    };

    const handleAdminLogout = () => {
        setAdminLoggedIn(false);
        localStorage.removeItem('adminLoggedIn');
        showSnackbar('Ses\u00edon finalizada', 'info');
        setCurrentPage('home');
    };

    const handleAddAdminUser = async (username, password) => {
        if (!username || !password) return;
        try {
            await addAdminUserService(usersCollectionPath, username, password);
            showSnackbar('Usuario creado', 'success');
        } catch (e) {
            console.error('Add user error:', e);
            showSnackbar(e.message || 'Error al crear usuario', 'error');
        }
    };


    const vehiclesCollectionPath = `artifacts/${appId}/public/data/vehiculos`;
    const configCollectionPath = `artifacts/${appId}/public/data/configuracion`;
    const usersCollectionPath = `artifacts/${appId}/public/data/usuarios`;

    useEffect(() => {
        setConfigLoading(true); // Set true when starting
        console.log("Setting up fetchInitialConfigService listener.");
        const unsubscribe = fetchInitialConfigService(
            configCollectionPath,
            (result) => {
                try {
                    if (result.error) {
                        showSnackbar(result.error, "error");
                        console.error("Error from fetchInitialConfigService:", result.error);
                    } else {
                        setValorMetroCubico(result.valor);
                        setConfigDocId(result.docId);
                        console.log("fetchInitialConfigService success: valor=", result.valor, "docId=", result.docId);
                    }
                } finally {
                    setConfigLoading(false);
                    console.log("fetchInitialConfigService callback processed, setConfigLoading(false) called.");
                }
            }
        );
        return () => {
            console.log("Unsubscribing from fetchInitialConfigService.");
            unsubscribe();
        };
    }, [configCollectionPath, showSnackbar]); // Added showSnackbar to dependencies

    useEffect(() => {
        const unsubscribe = fetchAdminUsersService(usersCollectionPath, (result) => {
            if (result.error) {
                showSnackbar(result.error, 'error');
            } else {
                setAdminUsers(result.data);
            }
        });
        return () => unsubscribe();
    }, [usersCollectionPath, showSnackbar]);

    const handleUpdateValorMetroCubico = async (nuevoValor) => {
        setLoading(true);
        try {
            const { updatedValor, newConfigDocId } = await updateValorMetroCubicoService(
                configCollectionPath,
                configDocId,
                nuevoValor
                // VALOR_METRO_CUBICO_DEFAULT // This is now imported directly by the service
            );
            setValorMetroCubico(updatedValor);
            if(newConfigDocId && !configDocId) setConfigDocId(newConfigDocId);
            showSnackbar("Valor por m³ actualizado.", "success"); // showSnackbar from useSnackbar
        } catch (error) {
            console.error("Error actualizando valor: ", error);
            showSnackbar(error.message || "Error al actualizar valor.", "error"); // showSnackbar from useSnackbar
        }
        setLoading(false);
    };

    // useEffect for onAuthStateChanged is now in useAuth hook
    
    useEffect(() => {
        if (!isAuthReady || !currentUser) {
            // If we return early, make sure 'loading' is false if this effect is not going to run.
            // However, 'setLoading(true)' is inside this guard.
            // If 'loading' could have been true from a previous render cycle of this same effect
            // that was then pre-empted by isAuthReady/currentUser changing, consider setting loading false here.
            // For now, let's assume this is fine as setLoading(true) is guarded.
            console.log("fetchAllVehiclesService effect: Auth not ready or no user, returning.");
            return;
        }
        setLoading(true);
        console.log("Setting up fetchAllVehiclesService listener.");
        const unsubscribe = fetchAllVehiclesService(vehiclesCollectionPath, (result) => {
            try {
                if (result.error) {
                    showSnackbar(result.error, "error");
                    console.error("Error from fetchAllVehiclesService:", result.error);
                } else {
                    setAllVehiclesForDashboard(result.data);
                    console.log("fetchAllVehiclesService success: vehicle count=", result.data?.length);
                }
            } finally {
                setLoading(false);
                console.log("fetchAllVehiclesService callback processed, setLoading(false) called.");
            }
        });
        return () => {
            console.log("Unsubscribing from fetchAllVehiclesService.");
            unsubscribe();
        };
    }, [isAuthReady, currentUser, vehiclesCollectionPath, showSnackbar]); // Added showSnackbar

    const applyFilters = () => {
        let results = allVehiclesForDashboard;
        if (searchTerm.trim()) {
            results = results.filter(v =>
                v.patente.toUpperCase().includes(searchTerm.trim().toUpperCase())
            );
        }
        if (filterTipoVehiculo) {
            results = results.filter(v => v.tipoVehiculo === filterTipoVehiculo);
        }
        if (filterDesde) {
            const from = new Date(filterDesde);
            results = results.filter(v => {
                if (!v.ultimaFechaDesinfeccion) return false;
                const d = typeof v.ultimaFechaDesinfeccion.toDate === 'function'
                    ? v.ultimaFechaDesinfeccion.toDate()
                    : new Date(v.ultimaFechaDesinfeccion);
                return d >= from;
            });
        }
        if (filterHasta) {
            const to = new Date(filterHasta);
            to.setHours(23, 59, 59, 999);
            results = results.filter(v => {
                if (!v.ultimaFechaDesinfeccion) return false;
                const d = typeof v.ultimaFechaDesinfeccion.toDate === 'function'
                    ? v.ultimaFechaDesinfeccion.toDate()
                    : new Date(v.ultimaFechaDesinfeccion);
                return d <= to;
            });
        }
        return results;
    };

    useEffect(() => {
        if (!isAuthReady || !currentUser) return;
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id && currentUser.isAnonymous) {
            selectVehicleForDetailService(vehiclesCollectionPath, id)
                .then(vehicle => {
                    setSelectedVehicleForApp(vehicle);
                    setCurrentPage('credential');
                    setGuestView(true);
                })
                .catch(e => {
                    console.error('Error loading vehicle for guest view:', e);
                    showSnackbar('Credencial no encontrada.', 'error');
                });
        }
    }, [isAuthReady, currentUser, vehiclesCollectionPath, showSnackbar]);

    useEffect(() => {
        if (currentPage === 'admin') {
            setSearchResults(applyFilters());
        }
    }, [allVehiclesForDashboard, currentPage, searchTerm, filterTipoVehiculo, filterDesde, filterHasta]);

    // showSnackbar and handleCloseSnackbar are obtained from useSnackbar hook

    const handleRegisterVehicle = async (vehicleData) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; } // showSnackbar from useSnackbar

        const plate = vehicleData.patente.toUpperCase();
        if (allVehiclesForDashboard.some(v => v.patente.toUpperCase() === plate)) {
            showSnackbar("Patente ya registrada.", "error");
            return;
        }

        setLoading(true);
        try {
            const newVehicle = await registerVehicleService(vehiclesCollectionPath, vehicleData, currentUser.uid);
            showSnackbar("Vehículo registrado.", "success"); // showSnackbar from useSnackbar
            setSelectedVehicleForApp(newVehicle);
            setCurrentPage('credential');
        } catch (e) {
            console.error("Register Error: ", e);
            showSnackbar(e.message || "Error al registrar.", "error"); // showSnackbar from useSnackbar
        }
        setLoading(false);
    };

    const handleSearchVehicle = async () => {
        setLoading(true);
        const results = applyFilters();
        setSearchResults(results);
        if (results.length === 0) {
            showSnackbar("No se encontraron vehículos.", "info");
        }
        setLoading(false);
    };
    
    const handleSelectVehicleForDetail = async (vehicleId, openAddForm = false) => {
        setLoading(true);
        try {
            const vehicleDetails = await selectVehicleForDetailService(vehiclesCollectionPath, vehicleId);
            setSelectedVehicleForApp(vehicleDetails);
            setAutoOpenAddForm(openAddForm);
            setCurrentPage('vehicleDetail');
        } catch (e) {
            console.error("Select Error: ", e);
            showSnackbar(e.message || "Error al cargar vehículo.", "error"); // showSnackbar from useSnackbar
        }
        setLoading(false);
    };

    // uploadFileToStorage is now in firestoreService.js and used by handleAddDisinfection service

    const handleAddDisinfection = async (vehicleId, disinfectionData, reciboFile, transaccionFile) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; } // showSnackbar from useSnackbar
        setLoading(true);
        try {
            const updatedVehicle = await addDisinfectionService(
                vehiclesCollectionPath,
                vehicleId,
                disinfectionData,
                reciboFile,
                transaccionFile,
                currentUser.uid,
                appId
            );
            setSelectedVehicleForApp(updatedVehicle);
            showSnackbar("Desinfección registrada.", "success"); // showSnackbar from useSnackbar
        } catch (e) { 
            console.error("Add Disinfection Error: ", e); 
            showSnackbar(e.message || "Error al registrar desinfección.", "error"); // showSnackbar from useSnackbar
        }
        setLoading(false);
    };

    const handleUpdateVehicle = async (vehicleId, data) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            const updated = await updateVehicleService(vehiclesCollectionPath, vehicleId, data);
            setSelectedVehicleForApp(updated);
            showSnackbar("Vehículo actualizado.", "success");
            setCurrentPage('vehicleDetail');
        } catch (e) {
            console.error("Update Vehicle Error: ", e);
            showSnackbar(e.message || "Error al actualizar vehículo.", "error");
        }
        setLoading(false);
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            await deleteVehicleService(vehiclesCollectionPath, vehicleId);
            showSnackbar("Vehículo eliminado.", "success");
            setCurrentPage('admin');
        } catch (e) {
            console.error("Delete Vehicle Error: ", e);
            showSnackbar(e.message || "Error al eliminar vehículo.", "error");
        }
        setLoading(false);
    };

    const handleUpdateDisinfection = async (vehicleId, fechaRegistroMillis, data) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            const updated = await updateDisinfectionService(vehiclesCollectionPath, vehicleId, fechaRegistroMillis, data);
            setSelectedVehicleForApp(updated);
            showSnackbar("Registro actualizado.", "success");
        } catch (e) {
            console.error("Update Disinfection Error: ", e);
            showSnackbar(e.message || "Error al actualizar registro.", "error");
        }
        setLoading(false);
    };

    const handleDeleteDisinfection = async (vehicleId, fechaRegistroMillis) => {
        if (!currentUser) { showSnackbar("Debe estar autenticado.", "error"); return; }
        setLoading(true);
        try {
            const updated = await deleteDisinfectionService(vehiclesCollectionPath, vehicleId, fechaRegistroMillis);
            setSelectedVehicleForApp(updated);
            showSnackbar("Registro eliminado.", "success");
        } catch (e) {
            console.error("Delete Disinfection Error: ", e);
            showSnackbar(e.message || "Error al eliminar registro.", "error");
        }
        setLoading(false);
    };
    
    const navigate = (page, vehicleData = null) => {
        if (vehicleData) setSelectedVehicleForApp(vehicleData);
        if (page !== 'vehicleDetail') setAutoOpenAddForm(false);
        setCurrentPage(page);
    };

    if (!isAuthReady) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}><CircularProgress /><Typography variant="h6" sx={{ mt: 2 }}>Cargando...</Typography></Box>;

    if (!adminLoggedIn && !guestView) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <LoginPage onLogin={handleAdminLogin} />
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> 
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="static" elevation={1}>
                    <Toolbar>
                        {isMobile && adminLoggedIn && !guestView && (
                            <IconButton color="inherit" edge="start" onClick={toggleDrawer(true)} sx={{ mr: 1 }}>
                                <MenuIcon />
                            </IconButton>
                        )}
                        <img src={LOGO_SAN_ISIDRO_URL} alt="Logo San Isidro" style={{height: 36, marginRight: 16, filter: 'brightness(0) invert(1)'}} onError={(e) => e.target.style.display='none'}/>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Control de Desinfección Vehicular</Typography>
                        {!isMobile && adminLoggedIn && !guestView && (
                            <>
                                <Button color="inherit" onClick={() => navigate('home')} title="Inicio">Inicio</Button>
                                <Button color="inherit" onClick={() => navigate('dashboard')} startIcon={<BarChartIcon/>}>Dashboard</Button>
                                <Button type="button" color="inherit" onClick={() => navigate('admin')} startIcon={<SettingsIcon/>}>Admin</Button>
                            </>
                        )}
                        {adminLoggedIn && !guestView && (
                            <Button color="inherit" onClick={handleAdminLogout}>Salir</Button>
                        )}
                        {currentUser && (
                            <Typography variant="caption" sx={{ ml: 2 }}>
                                ID: {adminLoggedIn ? 'admin' : currentUser.isAnonymous ? 'Anónimo' : currentUser.uid.substring(0, 6)}
                            </Typography>
                        )}
                    </Toolbar>
                </AppBar>
                {adminLoggedIn && !guestView && (
                    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                        <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
                            <List>
                                <ListItemButton onClick={() => navigate('home')}><ListItemText primary="Inicio" /></ListItemButton>
                                <ListItemButton onClick={() => navigate('dashboard')}><ListItemText primary="Dashboard" /></ListItemButton>
                                <ListItemButton onClick={() => navigate('admin')}><ListItemText primary="Admin" /></ListItemButton>
                            </List>
                        </Box>
                    </Drawer>
                )}
                <Container component="main" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
                    {(loading || configLoading || geminiLoading) && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1500 }}>
                           <Paper elevation={4} sx={{p:2, display:'flex', alignItems:'center', borderRadius:2}}> <CircularProgress size={24} sx={{mr:1}}/> <Typography>{geminiLoading ? "Procesando con IA..." : "Cargando..."}</Typography></Paper>
                        </Box>
                    )}
                    {adminLoggedIn && !guestView && currentPage === 'home' && <HomePage navigate={navigate} />}
                    {adminLoggedIn && !guestView && currentPage === 'register' && <VehicleForm onSubmit={handleRegisterVehicle} navigate={navigate} showSnackbar={showSnackbar} />}
                    {adminLoggedIn && !guestView && currentPage === 'editVehicle' && selectedVehicleForApp && (
                        <VehicleForm
                            onSubmit={(data) => handleUpdateVehicle(selectedVehicleForApp.id, data)}
                            navigate={navigate}
                            showSnackbar={showSnackbar}
                            initialData={selectedVehicleForApp}
                            editMode
                        />
                    )}
                    {adminLoggedIn && !guestView && currentPage === 'admin' && (
                        <AdminPage
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            handleSearch={handleSearchVehicle}
                            searchResults={searchResults}
                            handleSelectVehicle={handleSelectVehicleForDetail}
                            navigate={navigate}
                            valorMetroCubico={valorMetroCubico}
                            onUpdateValorMetroCubico={handleUpdateValorMetroCubico}
                            filterTipoVehiculo={filterTipoVehiculo}
                            setFilterTipoVehiculo={setFilterTipoVehiculo}
                            filterDesde={filterDesde}
                            setFilterDesde={setFilterDesde}
                            filterHasta={filterHasta}
                            setFilterHasta={setFilterHasta}
                            allVehicles={allVehiclesForDashboard}
                            adminUsers={adminUsers}
                            onAddUser={handleAddAdminUser}
                        />
                    )}
                    {adminLoggedIn && !guestView && currentPage === 'searchDisinfection' && (
                        <SearchDisinfectionPage
                            vehicles={allVehiclesForDashboard}
                            onSelectVehicle={(id) => handleSelectVehicleForDetail(id, true)}
                            navigate={navigate}
                        />
                    )}
                    {adminLoggedIn && !guestView && currentPage === 'dashboard' && <DashboardPage vehicles={allVehiclesForDashboard} />}
                    {adminLoggedIn && !guestView && currentPage === 'vehicleDetail' && selectedVehicleForApp && (
                        <VehicleDetailPage
                            vehicle={selectedVehicleForApp}
                            onAddDisinfection={handleAddDisinfection}
                            onUpdateDisinfection={handleUpdateDisinfection}
                            onDeleteDisinfection={handleDeleteDisinfection}
                            onDeleteVehicle={handleDeleteVehicle}
                            navigate={navigate}
                            showSnackbar={showSnackbar}
                            onOpenPaymentPage={() => setOpenPaymentModal(true)}
                            valorMetroCubico={valorMetroCubico}
                            setGeminiLoading={setGeminiLoading}
                            autoShowAddForm={autoOpenAddForm}
                            onAutoShowHandled={() => setAutoOpenAddForm(false)}
                        />
                    )}
                    {currentPage === 'credential' && selectedVehicleForApp && <DigitalCredential vehicle={selectedVehicleForApp} navigate={navigate} showSnackbar={showSnackbar} />}
                </Container>
                <Box component="footer" sx={{ bgcolor: 'background.paper', p: 3, borderTop: `1px solid ${theme.palette.divider}` }}><Typography variant="body2" color="text.secondary" align="center">&copy; {new Date().getFullYear()} Municipalidad de San Isidro</Typography></Box>
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert></Snackbar>
                <Modal open={openPaymentModal} onClose={() => setOpenPaymentModal(false)}>
                    <Box sx={{position: 'absolute',top: '50%',left: '50%',transform: 'translate(-50%, -50%)',width: '90%',maxWidth: '800px',height: '80vh',bgcolor: 'background.paper',border: '2px solid #000',boxShadow: 24,p: 0,display: 'flex',flexDirection: 'column',borderRadius: 2,overflow: 'hidden',}}>
                        <Box sx={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',p:1.5,borderBottom: `1px solid ${theme.palette.divider}`,backgroundColor: theme.palette.primary.main,color: 'white'}}>
                            <Typography variant="h6">Generar Boleta</Typography>
                            <IconButton onClick={() => setOpenPaymentModal(false)} color="inherit" size="small"><CloseIcon /></IconButton>
                        </Box>
                        <iframe src="https://boletadepago.gestionmsi.gob.ar/siste" title="Generador Boleta MSI" style={{ width: '100%', height: '100%', border: 'none', flexGrow: 1 }} />
                    </Box>
                </Modal>
            </Box>
        </ThemeProvider>
    );
}

export default App;
