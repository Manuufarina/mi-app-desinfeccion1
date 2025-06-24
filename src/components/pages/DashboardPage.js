import React, { useMemo, useState } from 'react';
import { Typography, Grid, Paper, Box, TextField, MenuItem } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// import { styled, useTheme } from '@mui/material/styles'; // useTheme is used, styled for StyledPaper is imported
import { useTheme } from '@mui/material/styles';
import { StyledPaper } from '../../theme'; // Import StyledPaper, theme is available via useTheme

// const StyledPaper = styled(Paper)(({ theme }) => ({ // Imported from theme
//     padding: theme.spacing(3), marginTop: theme.spacing(2), marginBottom: theme.spacing(2),
// }));

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const DashboardPage = ({ vehicles }) => {
    const theme = useTheme(); // MUI's useTheme hook
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const years = useMemo(() => {
        const startYear = 2020;
        return Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);
    }, [currentYear]);

    const monthName = MONTHS_ES[selectedMonth];

    const desinfeccionesMesActual = useMemo(() => {
        return vehicles.reduce((acc, vehicle) => {
            const historial = vehicle.historialDesinfecciones || [];
            historial.forEach(desinf => {
                if (desinf.fecha) {
                    const fechaDesinf = typeof desinf.fecha.toDate === 'function'
                        ? desinf.fecha.toDate()
                        : new Date(desinf.fecha);
                    if (!isNaN(fechaDesinf) &&
                        fechaDesinf.getMonth() === selectedMonth &&
                        fechaDesinf.getFullYear() === selectedYear) {
                        acc.push({ ...desinf, tipoVehiculo: vehicle.tipoVehiculo, patente: vehicle.patente });
                    }
                }
            });
            return acc;
        }, []);
    }, [vehicles, selectedMonth, selectedYear]);

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
            <Typography variant="h4" component="h1" gutterBottom sx={{textAlign: 'center', mb:3, color: theme.palette.primary.dark}}>
                Dashboard de Desinfecciones
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <TextField select label="Mes" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} size="small">
                    {MONTHS_ES.map((name, idx) => (
                        <MenuItem key={idx} value={idx}>{name}</MenuItem>
                    ))}
                </TextField>
                <TextField select label="Año" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} size="small">
                    {years.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                </TextField>
            </Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.primary.lighter+'22', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: theme.palette.primary.dark }}>Desinfecciones en {monthName} {selectedYear}</Typography>
                        <Typography variant="h3" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>{vehiculosDesinfectadosEsteMes}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                     <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: theme.palette.secondary.lighter+'22', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: theme.palette.secondary.dark }}>Recaudación de {monthName} {selectedYear}</Typography>
                        <Typography variant="h3" sx={{ color: theme.palette.secondary.main, fontWeight: 'bold' }}>${montoTotalRecaudadoMes.toFixed(2)}</Typography>
                    </Paper>
                </Grid>
                 <Grid item xs={12} md={4}>
                     <Paper elevation={3} sx={{ p: 2, textAlign: 'center', backgroundColor: (theme.palette.accent ? theme.palette.accent.main : '#D4AF37')+'22', height: '100%' }}>
                        <Typography variant="h6" style={{color: (theme.palette.accent ? theme.palette.accent.dark : '#D4AF37') || (theme.palette.accent ? theme.palette.accent.main : '#D4AF37')}}>Vehículos Registrados</Typography>
                        <Typography variant="h3" style={{color: (theme.palette.accent ? theme.palette.accent.main : '#D4AF37'), fontWeight: 'bold'}}>{vehicles.length}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={desinfeccionesPorTipo.length > 0 ? 7 : 12}>
                    <Paper elevation={2} sx={{p:2, mt:2}}>
                    <Typography variant="h6" gutterBottom sx={{mt:2, textAlign:'center'}}>Desinfecciones por Tipo de Vehículo ({monthName} {selectedYear})</Typography>
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
                        <Typography sx={{textAlign:'center', fontStyle:'italic', mt:3}}>No hay datos de desinfecciones para este periodo.</Typography>
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

export default DashboardPage;
