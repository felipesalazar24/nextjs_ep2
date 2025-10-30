// app/context/CartContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Cargar carrito desde localStorage al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('gameTechCart');
        console.log('📥 Cargando carrito desde localStorage:', savedCart);
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
                setCart([]);
            }
        }
        setIsLoaded(true);
    }, []);

    // Guardar carrito en localStorage cuando cambie
    useEffect(() => {
        if (isLoaded) {
            console.log('💾 Guardando carrito en localStorage:', cart);
            localStorage.setItem('gameTechCart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    // Agregar producto al carrito
    const addToCart = (product, quantity = 1) => {
        console.log('🛒 Agregando al carrito:', product.nombre, 'Cantidad:', quantity);
        
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            
            if (existingItem) {
                console.log('✅ Producto ya existe, actualizando cantidad');
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, cantidad: item.cantidad + quantity }
                        : item
                );
            } else {
                console.log('🆕 Producto nuevo, agregando al carrito');
                return [...prevCart, { 
                    ...product, 
                    cantidad: quantity 
                }];
            }
        });
    };

    // Eliminar producto del carrito
    const removeFromCart = (productId) => {
        console.log('🗑️ Eliminando producto del carrito:', productId);
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    // Actualizar cantidad de un producto
    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        console.log('📊 Actualizando cantidad:', productId, 'a', newQuantity);
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
        console.log('🧹 Limpiando carrito completo');
        setCart([]);
    };

    // Calcular total
    const getTotal = () => {
        const total = cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
        console.log('💰 Total calculado:', total);
        return total;
    };

    // Calcular cantidad total de items
    const getTotalItems = () => {
        const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
        console.log('📦 Total items en carrito:', totalItems);
        return totalItems;
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