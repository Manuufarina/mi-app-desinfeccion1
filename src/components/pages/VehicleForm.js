import React, { useState, useEffect } from 'react';
import {
    TextField, Button, Box, Grid, Typography, IconButton,
    MenuItem, FormControl, InputLabel, Select, Tooltip as MuiTooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import StraightenIcon from '@mui/icons-material/Straighten';
import EmailIcon from '@mui/icons-material/Email';
// import { styled } from '@mui/material/styles'; // StyledPaper is imported
// import Paper from '@mui/material/Paper'; // StyledPaper is imported
import { StyledPaper, TIPOS_VEHICULO, theme } from '../../theme'; // Import from theme

// Assuming theme, TIPOS_VEHICULO are passed as props or defined in a common constants file
// For now, let's define placeholders
// const theme = { // Placeholder // Imported from theme
//     palette: {
//         grey: {
//             100: '#f5f5f5' // Example color
//         },
//         primary: {
//             dark: '#005A2B' // Example color
//         }
//     }
// };
// const TIPOS_VEHICULO = ["Particular", "Remis", "Escolar", "Transporte de Carga", "Taxi", "Otro"]; // Imported from theme

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const VehicleForm = ({ onSubmit, navigate, showSnackbar, initialData = {} }) => {
    const [formData, setFormData] = useState({
        patente: initialData.patente || '',
        marca: initialData.marca || '',
        tipoVehiculo: initialData.tipoVehiculo || (TIPOS_VEHICULO.length > 0 ? TIPOS_VEHICULO[0] : ''), // Use imported TIPOS_VEHICULO
        largo: initialData.largo || '',
        ancho: initialData.ancho || '',
        altura: initialData.altura || '',
        metrosCubicos: initialData.metrosCubicos || '0.00',
        propietarioNombre: initialData.propietarioNombre || '',
        propietarioEmail: initialData.propietarioEmail || '',
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
            !formData.largo || !formData.ancho || !formData.altura ) {
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
                <Typography variant="h5" component="h2" sx={{ ml: 1, color: theme.palette.primary.dark }}>Registrar Vehículo</Typography>
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
                    <TextField
                        margin="normal"
                        fullWidth
                        id="propietarioEmail"
                        label="Email del Propietario (Opcional)"
                        name="propietarioEmail"
                        type="email"
                        value={formData.propietarioEmail}
                        onChange={handleChange}
                        InputProps={{ startAdornment: <EmailIcon sx={{mr:1, color:'action.active'}}/> }}
                    />
                <TextField margin="normal" fullWidth id="numeroVehiculoMunicipal" label="Número de Vehículo Municipal (Opcional)" name="numeroVehiculoMunicipal" value={formData.numeroVehiculoMunicipal} onChange={handleChange} InputProps={{ startAdornment: <DirectionsCarIcon sx={{mr:1, color:'action.active'}}/> }}/>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.2 }}>Registrar Vehículo</Button>
            </Box>
        </StyledPaper>
    );
};

export default VehicleForm;
