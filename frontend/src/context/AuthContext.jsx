import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('carelink_token');
        if (token) {
            checkAuth(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async (token) => {
        try {
            const res = await axios.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            console.error('Auth verification failed', err);
            localStorage.removeItem('carelink_token');
        } finally {
            setLoading(false);
        }
    };

    const login = (token, userData) => {
        localStorage.setItem('carelink_token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('carelink_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
