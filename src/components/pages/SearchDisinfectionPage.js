import React, { useState } from 'react';
import { StyledPaper } from '../../theme';
import { Typography, TextField, List, ListItem, ListItemText, Button, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';

const SearchDisinfectionPage = ({ vehicles, onSelectVehicle, navigate }) => {
    const [term, setTerm] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = () => {
        const filtered = vehicles.filter(v =>
            v.patente.toUpperCase().includes(term.trim().toUpperCase())
        );
        setResults(filtered);
    };

    return (
        <StyledPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => navigate('home')}><ArrowBackIcon /></IconButton>
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>Buscar Vehículo</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 3 }}>
                <TextField
                    variant="outlined"
                    label="Patente"
                    value={term}
                    onChange={(e) => setTerm(e.target.value.toUpperCase())}
                    sx={{ flexGrow: 1, minWidth: 160 }}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                />
                <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}>Buscar</Button>
            </Box>
            {results.length > 0 ? (
                <List>
                    {results.map(vehicle => (
                        <ListItem key={vehicle.id} divider secondaryAction={
                            <Button variant="outlined" size="small" onClick={() => onSelectVehicle(vehicle.id)}>Ver Detalles</Button>
                        }>
                            <ListItemText
                                primary={<Typography variant="subtitle1" color="primary">{vehicle.patente}</Typography>}
                                secondary={`${vehicle.marca} - ${vehicle.tipoVehiculo} - ${vehicle.propietarioNombre}`}
                            />
                        </ListItem>
                    ))}
                </List>
            ) : (
                <Typography sx={{ textAlign: 'center', mt: 3, fontStyle: 'italic' }} color="text.secondary">No hay resultados.</Typography>
            )}
        </StyledPaper>
    );
};

export default SearchDisinfectionPage;
