import React, { useState, useEffect } from 'react';
import {
    TextField, Button, Box, Typography, IconButton, List, ListItem, ListItemText,
    Accordion, AccordionSummary, AccordionDetails, InputAdornment,
    FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
// import { styled } from '@mui/material/styles'; // StyledPaper is imported
// import Paper from '@mui/material/Paper'; // StyledPaper is imported
import { StyledPaper, theme, TIPOS_VEHICULO } from '../../theme'; // Import from theme
import { exportDisinfectionsToExcel } from '../../services/excelExportService';

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const AdminPage = ({
    searchTerm,
    setSearchTerm,
    handleSearch,
    searchResults,
    handleSelectVehicle,
    navigate,
    valorMetroCubico,
    onUpdateValorMetroCubico,
    filterTipoVehiculo,
    setFilterTipoVehiculo,
    filterDesde,
    setFilterDesde,
    filterHasta,
    setFilterHasta,
    filterSinDesinfeccion,
    setFilterSinDesinfeccion,
    allVehicles,
    adminUsers,
    onAddUser,
}) => {
    const [nuevoValorM3, setNuevoValorM3] = useState(valorMetroCubico);
    const [exportDesde, setExportDesde] = useState('');
    const [exportHasta, setExportHasta] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('admin');

    useEffect(() => {
        setNuevoValorM3(valorMetroCubico);
    }, [valorMetroCubico]);

    const handleValorM3Change = (e) => {
        setNuevoValorM3(e.target.value);
    };

    const handleSaveValorM3 = () => {
        onUpdateValorMetroCubico(nuevoValorM3);
    };

    const handleExport = () => {
        const from = exportDesde ? new Date(exportDesde) : null;
        const to = exportHasta ? new Date(exportHasta) : null;
        if (to) to.setHours(23,59,59,999);
        exportDisinfectionsToExcel(allVehicles || [], from, to);
    };

    const handleCreateUser = () => {
        onAddUser(newUsername.trim(), newPassword, newRole);
        setNewUsername('');
        setNewPassword('');
        setNewRole('admin');
    };

    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('home')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" sx={{ ml: 1, color: theme.palette.primary.dark }}>Administración</Typography>
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

            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.dark }}>Buscar Vehículos</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 3 }}>
                <TextField variant="outlined" label="Patente" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toUpperCase())} sx={{ flexGrow: 1, minWidth: 160 }} inputProps={{ style: { textTransform: 'uppercase' } }}/>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel id="tipo-label">Tipo</InputLabel>
                    <Select labelId="tipo-label" label="Tipo" value={filterTipoVehiculo} onChange={(e) => setFilterTipoVehiculo(e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        {TIPOS_VEHICULO.map(tipo => (
                            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField type="date" label="Desde" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}/>
                <TextField type="date" label="Hasta" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}/>
                <FormControlLabel
                    control={<Checkbox checked={filterSinDesinfeccion} onChange={(e) => setFilterSinDesinfeccion(e.target.checked)} />}
                    label="Sin desinfección"
                />
                <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>Buscar</Button>
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

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.dark }}>Exportar Desinfecciones</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TextField type="date" label="Desde" value={exportDesde} onChange={(e) => setExportDesde(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}/>
                    <TextField type="date" label="Hasta" value={exportHasta} onChange={(e) => setExportHasta(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}/>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Exportar</Button>
                </Box>
            </Box>

            <Accordion sx={{ mt: 4 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-users-content" id="panel-users-header">
                    <PersonIcon sx={{ mr: 1, color: 'action.active' }} /> <Typography>Usuarios</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <TextField label="Usuario" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} size="small" />
                        <TextField label="Contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} size="small" />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id="role-label">Rol</InputLabel>
                            <Select labelId="role-label" label="Rol" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="revisor">Revisor</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="contained" onClick={handleCreateUser}>Agregar</Button>
                    </Box>
                    <List dense>
                        {adminUsers && adminUsers.map(u => (
                            <ListItem key={u.id}><ListItemText primary={`${u.username} (${u.role})`} /></ListItem>
                        ))}
                    </List>
                </AccordionDetails>
            </Accordion>
        </StyledPaper>
    );
};

export default AdminPage;
