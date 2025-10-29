// app/context/AuthContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Usuarios administradores
const administradores = [
    { email: "mati.vegaa@duocuc.cl", password: "adminmatias", nombre: "Matias" },
    { email: "fe.salazarv@duocuc.cl", password: "adminfelipe", nombre: "Felipe" }
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Cargar usuario desde localStorage al iniciar
    useEffect(() => {
        const savedUser = localStorage.getItem('gameTechUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    // Login function
    const login = (email, password) => {
        // Verificar si es administrador
        const admin = administradores.find(admin => 
            admin.email === email && admin.password === password
        );
        
        if (admin) {
            const userData = { ...admin, isAdmin: true };
            setUser(userData);
            localStorage.setItem('gameTechUser', JSON.stringify(userData));
            return { success: true, isAdmin: true };
        }

        // Verificar si es usuario normal
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            if (userData.email === email && userData.password === password) {
                setUser({ ...userData, isAdmin: false });
                localStorage.setItem('gameTechUser', JSON.stringify({ ...userData, isAdmin: false }));
                return { success: true, isAdmin: false };
            }
        }

        return { success: false, message: 'Credenciales incorrectas' };
    };

    // Register function
    const register = (userData) => {
        // Validar email (solo dominios permitidos)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|duocuc\.cl|profesor\.duoc\.cl)$/;
        if (!emailRegex.test(userData.email)) {
            return { success: false, message: 'Dominio de email no permitido' };
        }

        // Validar contraseña (4-10 caracteres)
        if (userData.password.length < 4 || userData.password.length > 10) {
            return { success: false, message: 'La contraseña debe tener entre 4 y 10 caracteres' };
        }

        // Guardar usuario
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
    };

    // Logout function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('gameTechUser');
    };

    const value = {
        user,
        login,
        register,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
}