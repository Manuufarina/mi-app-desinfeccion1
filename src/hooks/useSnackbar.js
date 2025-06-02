import { useState, useCallback } from 'react'; // Add useCallback

export const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const showSnackbar = useCallback((message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    }, []); // setSnackbar is stable, so empty dependency array is fine

    const handleCloseSnackbar = useCallback((_, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        // It's generally safer to use the functional update form of setState
        // if the new state depends on the previous state, to avoid stale closures,
        // though with useCallback's own dependency array including snackbar, it's less of an issue here.
        // However, best practice would be:
        // setSnackbar(prevSnackbar => ({ ...prevSnackbar, open: false }));
        // For this specific case, directly using snackbar in the deps array of useCallback
        // and then in the function body is also acceptable.
        setSnackbar(prevSnackbar => ({ ...prevSnackbar, open: false }));
    }, []); // handleCloseSnackbar depends on no external variables from the hook's scope that change
    // If it did use `snackbar` directly like `setSnackbar({ ...snackbar, open: false });`
    // then `snackbar` would need to be in the dependency array: `}, [snackbar]);`
    // Given it was `setSnackbar({ ...snackbar, open: false });` before, let's use the functional update `setSnackbar(prevSnackbar => ({ ...prevSnackbar, open: false }));` which is safer and allows an empty dependency array for useCallback.


    return { snackbar, showSnackbar, handleCloseSnackbar };
};
