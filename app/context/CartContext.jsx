"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const CartContext = createContext({
  cart: [],
  items: [],
  addToCart: () => [],
  removeFromCart: () => [],
  updateQuantity: () => [],
  clearCart: () => [],
  getTotal: () => 0,
  getTotalItems: () => 0,
  getCount: () => 0,
  lastError: null,
  clearError: () => {},
});

const STORAGE_PREFIX = "cart_";

const getStorageKeyForUser = (user) => {
  if (!user) return `${STORAGE_PREFIX}guest`;
  const id = user.id ?? user.email ?? user.uid ?? user.nombre ?? "unknown";
  return `${STORAGE_PREFIX}${String(id)}`;
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState(() => []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastError, setLastError] = useState(null);

  const initKeyRef = useRef(null);

  useEffect(() => {
    const key = getStorageKeyForUser(user);
    if (initKeyRef.current === key) {
      setIsLoaded(true);
      return;
    }
    initKeyRef.current = key;

    try {
      const raw =
        typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCart(parsed);
          setLastError(null);
        } else {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error("Error cargando carrito desde localStorage:", err);
      setCart([]);
      setLastError("Error cargando carrito");
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    try {
      const key = getStorageKeyForUser(user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(cart));
      }
    } catch (err) {
      console.error("Error guardando carrito en localStorage:", err);
      setLastError("Error guardando carrito");
    }
  }, [cart, user]);

  const requireAuth = () => {
    if (!user) {
      setLastError("Debes iniciar sesión para usar el carrito");
      try {
        router.push("/login");
      } catch (err) {}
      return false;
    }
    return true;
  };

  const clearError = () => setLastError(null);

  const addToCart = (product, quantity = 1) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    if (!product || typeof product.id === "undefined") {
      setLastError("Producto inválido");
      return cart.slice();
    }

    let newCart = [];
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        newCart = prev.map((i) =>
          i.id === product.id
            ? { ...i, cantidad: (Number(i.cantidad) || 0) + Number(quantity) }
            : i
        );
      } else {
        newCart = [...prev, { ...product, cantidad: Number(quantity) }];
      }
      return newCart;
    });

    return newCart;
  };

  const removeFromCart = (productId) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    let newCart = [];
    setCart((prev) => {
      newCart = prev.filter((i) => i.id !== productId);
      return newCart;
    });
    return newCart;
  };

  const updateQuantity = (productId, newQuantity) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    let newCart = [];
    if (Number(newQuantity) <= 0) {
      setCart((prev) => {
        newCart = prev.filter((i) => i.id !== productId);
        return newCart;
      });
      return newCart;
    }

    setCart((prev) => {
      newCart = prev.map((i) =>
        i.id === productId ? { ...i, cantidad: Number(newQuantity) } : i
      );
      return newCart;
    });
    return newCart;
  };

  const clearCart = () => {
    clearError();
    if (!requireAuth()) return cart.slice();

    setCart([]);
    return [];
  };

  const getTotal = () =>
    cart.reduce(
      (acc, it) => acc + Number(it.precio || 0) * Number(it.cantidad || 0),
      0
    );

  const getTotalItems = () =>
    cart.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);

  const getCount = () => getTotalItems();

  const value = {
    cart,
    items: cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getTotalItems,
    getCount,
    lastError,
    clearError,
    isLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de CartProvider");
  }
  return context;
}
