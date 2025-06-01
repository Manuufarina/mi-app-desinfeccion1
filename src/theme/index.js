import { createTheme, styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

export const LOGO_SAN_ISIDRO_URL = "https://www.sanisidro.gob.ar/sites/default/files/logo_san_isidro_horizontal_blanco_web_1.png";

export const sanIsidroGreen = '#005A2B';
export const sanIsidroLightGreen = '#4CAF50';
export const sanIsidroAccent = '#D4AF37';

export const theme = createTheme({
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

export const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

export const TIPOS_VEHICULO = ["Particular", "Remis", "Escolar", "Transporte de Carga", "Taxi", "Otro"];
export const VALOR_METRO_CUBICO_DEFAULT = 150;
