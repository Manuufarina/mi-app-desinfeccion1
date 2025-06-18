import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material';
import { StyledPaper, theme } from '../../theme';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username.trim(), password);
    };

    return (
        <StyledPaper sx={{ mt: 8, p: 4, maxWidth: 400, mx: 'auto' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ color: theme.palette.primary.dark }}>
                Iniciar Sesión
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
                <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
                <Button type="submit" variant="contained" color="primary">Ingresar</Button>
            </Box>
        </StyledPaper>
    );
};

export default LoginPage;
