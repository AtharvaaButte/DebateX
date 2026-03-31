import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const refreshProfile = async () => {
        if (!localStorage.getItem('debate_token')) {
            setProfile(null);
            setLoadingProfile(false);
            return;
        }
        try {
            const data = await getProfile();
            setProfile(data.profile);
        } catch (err) {
            setProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <AuthContext.Provider value={{ profile, setProfile, refreshProfile, loadingProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
