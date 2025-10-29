// app/context/CartContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    // Cargar carrito desde localStorage al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('gameTechCart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('gameTechCart', JSON.stringify(cart));
    }, [cart]);

    // Agregar producto al carrito
    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            
            if (existingItem) {
                // Si ya existe, actualizar cantidad
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, cantidad: item.cantidad + quantity }
                        : item
                );
            } else {
                // Si no existe, agregar nuevo item
                return [...prevCart, { 
                    ...product, 
                    cantidad: quantity 
                }];
            }
        });
    };

    // Eliminar producto del carrito
    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    // Actualizar cantidad de un producto
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId
                    ? { ...item, cantidad: newQuantity }
                    : item
            )
        );
    };

    // Limpiar carrito
    const clearCart = () => {
        setCart([]);
    };

    // Calcular total
    const getTotal = () => {
        return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    };

    // Calcular cantidad total de items
    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.cantidad, 0);
    };

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getTotalItems
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe ser usado dentro de CartProvider');
    }
    return context;
}