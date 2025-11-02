// lib/products.js
// Wrapper para exponer los productos desde data/productos.json
// Crear en: <repo-root>/lib/products.js

import productosJson from "../data/productos.json";

/**
 * Devuelve el array de productos (copia para evitar mutaciones accidentales).
 */
export const getProductos = () => {
  return Array.isArray(productosJson)
    ? productosJson.map((p) => ({ ...p }))
    : [];
};

/**
 * Busca un producto por id (número).
 */
export const getProductoById = (id) => {
  const productos = getProductos();
  return productos.find((p) => Number(p.id) === Number(id)) || null;
};

export default {
  getProductos,
  getProductoById,
};
