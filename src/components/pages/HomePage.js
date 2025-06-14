import React from 'react';
import { Typography, Button, Grid } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
// import { styled } from '@mui/material/styles'; // StyledPaper is now imported
// import Paper from '@mui/material/Paper'; // StyledPaper is now imported
import { StyledPaper, LOGO_SAN_ISIDRO_URL, theme } from '../../theme'; // Import from theme

// Assuming theme and LOGO_SAN_ISIDRO_URL are passed as props or defined in a common constants file
// For now, let's define a placeholder theme and LOGO_SAN_ISIDRO_URL
// const theme = { // Placeholder // Imported from theme
//     spacing: (val) => `${val * 8}px`, // Basic spacing implementation
//     palette: {
//         primary: {
//             dark: '#005A2B' // Example color
//         }
//     }
// };
// const LOGO_SAN_ISIDRO_URL = "https://www.sanisidro.gob.ar/sites/default/files/logo_san_isidro_horizontal_blanco_web_1.png"; // Imported from theme

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const HomePage = ({ navigate }) => (
    <StyledPaper sx={{ textAlign: 'center', mt: 4, p: 4 }}>
        <img src={LOGO_SAN_ISIDRO_URL} alt="Logo Municipalidad de San Isidro" style={{ maxWidth: '250px', marginBottom: theme.spacing(3) }} onError={(e) => e.target.style.display='none'}/>
        {/* Use theme.palette.primary.dark directly if needed, or ensure sx prop handles it */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: theme.palette.primary.dark }}>
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
                <Button fullWidth variant="contained" color="primary" size="large" startIcon={<AddCircleIcon />} onClick={() => navigate('searchDisinfection')} sx={{ py: 1.5 }}>
                    Nueva Desinfección
                </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Button type="button" fullWidth variant="contained" color="secondary" size="large" startIcon={<SettingsIcon />} onClick={() => navigate('admin')} sx={{ py: 1.5 }}>
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

export default HomePage;
