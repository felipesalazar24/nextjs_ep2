import productosJson from "../data/productos.json";

export const getProductos = () => {
  return Array.isArray(productosJson)
    ? productosJson.map((p) => ({ ...p }))
    : [];
};

export const getProductoById = (id) => {
  const productos = getProductos();
  return productos.find((p) => Number(p.id) === Number(id)) || null;
};

const productsApi = {
  getProductos,
  getProductoById,
};

export default productsApi;
