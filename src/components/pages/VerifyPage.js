import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { StyledPaper } from '../../theme';
import DigitalCredential from './DigitalCredential';
import { handleSelectVehicleForDetail } from '../../services/firestoreService';

const VerifyPage = ({ vehicleId, vehiclesCollectionPath, navigate, showSnackbar }) => {
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVehicle = async () => {
            setLoading(true);
            try {
                const data = await handleSelectVehicleForDetail(vehiclesCollectionPath, vehicleId);
                setVehicle(data);
            } catch (e) {
                console.error(e);
                setError('Vehículo no encontrado.');
            } finally {
                setLoading(false);
            }
        };
        if (vehicleId) fetchVehicle();
    }, [vehicleId, vehiclesCollectionPath]);

    if (loading) {
        return (
            <StyledPaper sx={{ textAlign: 'center' }}>
                <CircularProgress />
            </StyledPaper>
        );
    }

    if (error || !vehicle) {
        return (
            <StyledPaper sx={{ textAlign: 'center' }}>
                <IconButton onClick={() => navigate('home')}><ArrowBackIcon /></IconButton>
                <Typography color="error" sx={{ mt: 2 }}>{error || 'Error al cargar datos.'}</Typography>
            </StyledPaper>
        );
    }

    return (
        <DigitalCredential
            vehicle={vehicle}
            navigate={navigate}
            showSnackbar={showSnackbar}
            hideBackButton={false}
            verificationUrl={`${window.location.origin}/verify/${vehicleId}`}
        />
    );
};

export default VerifyPage;
