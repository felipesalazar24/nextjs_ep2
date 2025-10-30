'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        setUser(JSON.parse(raw));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('AuthProvider: error leyendo user desde localStorage', err);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const saveUser = (u) => {
    setUser(u);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch (err) {
      console.error('AuthProvider: error guardando user en localStorage', err);
    }
  };

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
      saveUser(data);
      return { success: true, isAdmin: data.rol === 'admin', user: data };
    } catch (err) {
      console.error('AuthProvider.login error', err);
      return { success: false, message: 'Error de red' };
    }
  };

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
      return { success: true, user: data };
    } catch (err) {
      console.error('AuthProvider.register error', err);
      return { success: false, message: 'Error de red' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('AuthProvider.logout error', err);
    }
    try {
      router.push('/');
    } catch (e) {
      console.warn('AuthProvider.logout: router.push falló', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      login: async () => ({ success: false }),
      register: async () => ({ success: false }),
      logout: () => {},
      hydrated: false,
    };
  }
  return ctx;
}