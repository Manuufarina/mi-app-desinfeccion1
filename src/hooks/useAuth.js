/* global __initial_auth_token */
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useSnackbar } from './useSnackbar'; // Import useSnackbar

export const useAuth = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const { showSnackbar } = useSnackbar(); // Use the snackbar hook

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                        // setCurrentUser will be set by onAuthStateChanged listener
                    } else {
                        await signInAnonymously(auth);
                        // setCurrentUser will be set by onAuthStateChanged listener
                    }
                } catch (e) {
                    console.error("Auth Error in useAuth: ", e);
                    showSnackbar("Error de autenticación: " + e.message, "error");
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubAuth();
    }, [showSnackbar]); // showSnackbar is stable, so this effect runs once

    return { currentUser, isAuthReady, showSnackbar }; // Return showSnackbar as well, as App.js might still need to pass it down
};
