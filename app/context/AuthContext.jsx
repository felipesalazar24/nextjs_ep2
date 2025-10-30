'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Inicializar desde localStorage (mantener comportamiento actual)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error('AuthContext: error leyendo localStorage', e);
    }
  }, []);

  // Guarda usuario en state y localStorage
  const saveUser = (u) => {
    setUser(u);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch (e) {
      console.error('AuthContext: error guardando localStorage', e);
    }
  };

  // login usa el endpoint /api/auth/login
  // devuelve { success: boolean, message?, isAdmin?, user? }
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Error al iniciar sesión' };
      }

      // data es el usuario (sin password)
      saveUser(data);
      return { success: true, isAdmin: data.rol === 'admin', user: data };
    } catch (err) {
      console.error('AuthContext login error', err);
      return { success: false, message: 'Error de red' };
    }
  };

  // register usa POST /api/usuarios
  // recibe el objeto formData y devuelve { success, message, user? }
  const register = async (payload) => {
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || 'Error al registrar' };
      }

      // No hacemos login automático (mantener flujo actual)
      return { success: true, user: data };
    } catch (err) {
      console.error('AuthContext register error', err);
      return { success: false, message: 'Error de red' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    } catch (e) {
      console.error('AuthContext: error limpiando localStorage', e);
    }
    // opcional: redirigir a home
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}