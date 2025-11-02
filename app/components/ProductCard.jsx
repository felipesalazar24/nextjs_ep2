"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ producto }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAdd = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    addToCart(producto, 1);
    // puedes usar toast en vez de alert
    alert(`${producto.nombre} agregado al carrito`);
  };

  return (
    <div className="product-card">
      <img
        src={producto.imagen}
        alt={producto.nombre}
        style={{ maxWidth: "100%" }}
      />
      <h3>{producto.nombre}</h3>
      <p>${Number(producto.precio).toLocaleString("es-CL")}</p>
      <button className="btn btn-primary" onClick={handleAdd}>
        Agregar
      </button>
    </div>
  );
}
