// data/database.js
export const productos = [
  {
    id: 1,
    nombre: "Logitech G502",
    precio: 83000,
    imagen: "//productos/productos/M1.jpg",
    descripcion:
      "El Logitech G502 LIGHTSPEED es un mouse inalámbrico diseñado para gamers que buscan un alto rendimiento, precisión y libertad de movimiento sin cables. Este modelo combina la icónica forma del G502 con la avanzada tecnología inalámbrica LIGHTSPEED, que ofrece una conexión ultrarrápida y confiable con un tiempo de respuesta de 1 ms. Equipado con el sensor óptico de próxima generación HERO 16K (o en algunas versiones HERO 25K), proporciona una sensibilidad ajustable de hasta 25,600 DPI, garantizando un seguimiento preciso y eficiente en cualquier tipo de juego.",
    miniaturas: [
      "//productos/M1.jpg",
      "//productos/M1.1.jpg",
      "//productos/M1.2.jpg",
      "//productos/M1.3.jpg",
    ],
    atributo: "Mouse",
  },
  {
    id: 2,
    nombre: "Logitech G305 LightSpeed Wireless",
    precio: 35000,
    imagen: "//productos/M2.1.jpg",
    descripcion:
      "El Logitech G305 LightSpeed es un mouse inalámbrico diseñado para gamers y usuarios que buscan un rendimiento profesional con tecnología avanzada. Incorpora el sensor óptico HERO de próxima generación, que ofrece una precisión excepcional con una resolución ajustable de hasta 12,000 DPI y una eficiencia energética hasta 10 veces superior a generaciones anteriores. Su tecnología inalámbrica LIGHTSPEED garantiza una conexión ultrarrápida con una latencia de solo 1 ms, comparable a la de un mouse con cable.",
    miniaturas: [
      "//productos/M2.jpg",
      "//productos/M2.1.jpg",
      "//productos/M2.2.jpg",
      "//productos/M2.3.jpg",
    ],
    atributo: "Mouse",
  },
  // ... todos los demás productos iguales
];

// Carrito en memoria (luego lo haremos con estado global)
export let cart = [];

export const addToCart = (productId, cantidad = 1) => {
  const product = productos.find((p) => p.id === productId);
  if (!product) return cart;

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.cantidad += cantidad;
  } else {
    cart.push({ ...product, cantidad });
  }
  return cart;
};

export const getCartCount = () => {
  return cart.reduce((count, item) => count + item.cantidad, 0);
};
