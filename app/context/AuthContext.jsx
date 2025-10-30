"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        setUser(JSON.parse(raw));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("AuthContext: error leyendo localStorage", e);
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  const saveUser = (u) => {
    setUser(u);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (e) {
      console.error("AuthContext: error guardando localStorage", e);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok)
        return {
          success: false,
          message: data.error || "Error al iniciar sesión",
        };
      saveUser(data);
      return { success: true, isAdmin: data.rol === "admin", user: data };
    } catch (err) {
      console.error("AuthContext login error", err);
      return { success: false, message: "Error de red" };
    }
  };

  const register = async (payload) => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        return { success: false, message: data.error || "Error al registrar" };
      return { success: true, user: data };
    } catch (err) {
      console.error("AuthContext register error", err);
      return { success: false, message: "Error de red" };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    } catch (e) {
      console.error("AuthContext: error limpiando localStorage", e);
    }
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth tolerante: no lanza si falta provider, devuelve una API segura
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback seguro si el provider no está presente
    return {
      user: null,
      login: async () => ({
        success: false,
        message: "Auth provider no disponible",
      }),
      register: async () => ({
        success: false,
        message: "Auth provider no disponible",
      }),
      logout: () => {},
      hydrated: true,
    };
  }
  return ctx;
}
