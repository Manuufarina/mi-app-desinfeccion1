import React, { useState, useEffect } from 'react';
import { 
    TextField, Button, Box, Typography, IconButton, List, ListItem, ListItemText,
    Accordion, AccordionSummary, AccordionDetails, InputAdornment,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
// import { styled } from '@mui/material/styles'; // StyledPaper is imported
// import Paper from '@mui/material/Paper'; // StyledPaper is imported
import { StyledPaper, theme, TIPOS_VEHICULO } from '../../theme'; // Import from theme

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
}) => {
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
        </StyledPaper>
    );
};

export default AdminPage;
