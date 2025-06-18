import React from 'react';
import { StyledPaper } from '../../theme';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

const LogsPage = ({ logs }) => (
    <StyledPaper>
        <Typography variant="h5" component="h2" gutterBottom>Logs del Sistema</Typography>
        {logs && logs.length > 0 ? (
            <List>
                {logs.map(log => {
                    const date = log.timestamp && typeof log.timestamp.toDate === 'function'
                        ? log.timestamp.toDate()
                        : new Date(log.timestamp);
                    return (
                        <ListItem key={log.id} divider>
                            <ListItemText
                                primary={`${date.toLocaleString()} - ${log.action}`}
                                secondary={log.details || ''}
                            />
                        </ListItem>
                    );
                })}
            </List>
        ) : (
            <Typography color="text.secondary" sx={{ mt:2, fontStyle:'italic' }}>No hay logs para mostrar.</Typography>
        )}
    </StyledPaper>
);

export default LogsPage;
