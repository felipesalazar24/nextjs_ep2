"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart =
        typeof window !== "undefined"
          ? localStorage.getItem("gameTechCart")
          : null;
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error("CartProvider: error leyendo localStorage", err);
      setCart([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("gameTechCart", JSON.stringify(cart));
      } catch (err) {
        console.error("CartProvider: error guardando localStorage", err);
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, cantidad: i.cantidad + quantity } : i
        );
      }
      return [...prev, { ...product, cantidad: quantity }];
    });
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.id !== productId));
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      setCart((prev) => prev.filter((i) => i.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.id === productId ? { ...i, cantidad: newQuantity } : i
      )
    );
  };
  const clearCart = () => setCart([]);

  const getTotal = () => {
    try {
      return cart.reduce(
        (sum, item) =>
          sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0
      );
    } catch (err) {
      console.error("CartProvider.getTotal error", err);
      return 0;
    }
  };

  const getTotalItems = () => {
    try {
      return cart.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    } catch (err) {
      console.error("CartProvider.getTotalItems error", err);
      return 0;
    }
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// useCart tolerante: no lanza si falta provider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      getTotal: () => 0,
      getTotalItems: () => 0,
    };
  }
  return ctx;
}
