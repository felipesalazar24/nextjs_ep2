"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
} from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";

const productos = [
  {
    id: 1,
    nombre: "Logitech G502",
    precio: 83000,
    imagen: "/assets/productos/M1.jpg",
    descripcion:
      "El Logitech G502 LIGHTSPEED es un mouse inalámbrico diseñado para gamers que buscan un alto rendimiento, precisión y libertad de movimiento sin cables.",
    miniaturas: [
      "/assets/productos/M1.1.jpg",
      "/assets/productos/M1.2.jpg",
      "/assets/productos/M1.3.jpg",
    ],
    atributo: "Mouse",
    especificaciones: {
      Tipo: "Mouse Gaming Inalámbrico",
      Sensor: "HERO 25K",
      DPI: "25,600",
      Botones: "11 programables",
      Conectividad: "LIGHTSPEED 2.4GHz",
    },
  },
  {
    id: 2,
    nombre: "Logitech G305 LightSpeed Wireless",
    precio: 35000,
    imagen: "/assets/productos/M2.1.jpg",
    descripcion:
      "El Logitech G305 LightSpeed es un mouse inalámbrico diseñado para gamers y usuarios que buscan un rendimiento profesional con tecnología avanzada.",
    miniaturas: [
      "/assets/productos/M2.1.jpg",
      "/assets/productos/M2.2.jpg",
      "/assets/productos/M2.3.jpg",
    ],
    atributo: "Mouse",
    especificaciones: {
      Tipo: "Mouse Gaming Inalámbrico",
      Sensor: "HERO 12K",
      DPI: "12,000",
      Botones: "6 programables",
      Conectividad: "LIGHTSPEED 2.4GHz",
    },
  },
  {
    id: 3,
    nombre: "Logitech G203 Lightsync Blue",
    precio: 20000,
    imagen: "/assets/productos/M3.jpg",
    descripcion:
      "El Logitech G203 Lightsync Blue es un mouse gamer alámbrico diseñado para ofrecer precisión, personalización y rendimiento en juegos.",
    miniaturas: [
      "/assets/productos/M3.1.jpg",
      "/assets/productos/M3.2.jpg",
      "/assets/productos/M3.3.jpg",
    ],
    atributo: "Mouse",
    especificaciones: {
      Tipo: "Mouse Gaming Alámbrico",
      Sensor: "Optico Logitech",
      DPI: "8,000",
      Botones: "6 programables",
      Conectividad: "USB",
    },
  },
  {
    id: 4,
    nombre: "Redragon Kumara K552 Rainbow",
    precio: 26000,
    imagen: "/assets/productos/T1.jpg",
    descripcion:
      "El Redragon Kumara K552 Rainbow es un teclado mecánico diseñado especialmente para gamers y usuarios que buscan un periférico resistente.",
    miniaturas: [
      "/assets/productos/T1.1.jpg",
      "/assets/productos/T1.2.jpg",
      "/assets/productos/T1.3.jpg",
    ],
    atributo: "Teclado",
    especificaciones: {
      Tipo: "Teclado Mecánico Compacto",
      Switches: "Outemu Blue",
      Iluminación: "RGB Rainbow",
      Conectividad: "USB",
      Construcción: "Placa de acero reforzada",
    },
  },
  {
    id: 5,
    nombre: "Logitech G PRO X TKL",
    precio: 182000,
    imagen: "/assets/productos/T2.jpg",
    descripcion:
      "El Logitech PRO X TKL Lightspeed es un teclado mecánico diseñado para jugadores profesionales y entusiastas del gaming.",
    miniaturas: [
      "/assets/productos/T2.1.jpg",
      "/assets/productos/T2.2.jpg",
      "/assets/productos/T2.3.jpg",
    ],
    atributo: "Teclado",
    especificaciones: {
      Tipo: "Teclado Mecánico Inalámbrico",
      Switches: "GX Brown Táctiles",
      Iluminación: "LIGHTSYNC RGB",
      Conectividad: "LIGHTSPEED / USB-C",
      Formato: "Tenkeyless (TKL)",
    },
  },
  {
    id: 6,
    nombre: "Razer BlackWidow V4 75% - Black",
    precio: 165000,
    imagen: "/assets/productos/T3.jpg",
    descripcion:
      "El Razer BlackWidow V4 75% es un teclado mecánico compacto diseñado para usuarios y gamers que buscan un equilibrio entre portabilidad y rendimiento.",
    miniaturas: [
      "/assets/productos/T3.1.jpg",
      "/assets/productos/T3.2.jpg",
      "/assets/productos/T3.3.jpg",
    ],
    atributo: "Teclado",
    especificaciones: {
      Tipo: "Teclado Mecánico Compacto 75%",
      Switches: "Razer Green",
      Iluminación: "Razer Chroma RGB",
      Conectividad: "USB-C desmontable",
      Construcción: "Aluminio premium",
    },
  },
  {
    id: 7,
    nombre: "Logitech G435 - Black/Yellow",
    precio: 58000,
    imagen: "/assets/productos/A1.jpg",
    descripcion:
      "Los Logitech G435 son audífonos inalámbricos diseñados especialmente para gaming, que combinan la tecnología LIGHTSPEED y Bluetooth.",
    miniaturas: ["/assets/productos/A1.1.jpg", "/assets/productos/A1.2.jpg"],
    atributo: "Audifono",
    especificaciones: {
      Tipo: "Audífonos Gaming Inalámbricos",
      Conectividad: "LIGHTSPEED 2.4GHz / Bluetooth",
      Micrófono: "Integrado con cancelación de ruido",
      "Duración de batería": "18 horas",
      Peso: "165 g",
    },
  },
  {
    id: 8,
    nombre: "Razer BlackShark V2 X",
    precio: 37000,
    imagen: "/assets/productos/A2.jpg",
    descripcion:
      "Los Razer BlackShark V2 X son audífonos diseñados especialmente para gamers y entusiastas de los esports.",
    miniaturas: [
      "/assets/productos/A2.1.jpg",
      "/assets/productos/A2.2.jpg",
      "/assets/productos/A2.3.jpg",
    ],
    atributo: "Audifono",
    especificaciones: {
      Tipo: "Audífonos Gaming Alámbricos",
      Conectividad: "Jack 3.5 mm",
      Micrófono: "Razer HyperClear Cardioide",
      Drivers: "TriForce 50 mm",
      Compatibilidad: "PC, PS5, Xbox, Switch",
    },
  },
  {
    id: 9,
    nombre: "Logitech G335 - Black",
    precio: 43000,
    imagen: "/assets/productos/A3.jpg",
    descripcion:
      "Los Logitech G335 son audífonos gamer diseñados para ofrecer una experiencia de sonido clara y envolvente.",
    miniaturas: [
      "/assets/productos/A3.1.jpg",
      "/assets/productos/A3.2.jpg",
      "/assets/productos/A3.3.jpg",
    ],
    atributo: "Audifono",
    especificaciones: {
      Tipo: "Audífonos Gaming con cable",
      Conectividad: "Jack 3.5 mm",
      Micrófono: "Integrado abatible",
      Peso: "240 g",
      Compatibilidad: "PC, Consolas, Móviles",
    },
  },
  {
    id: 10,
    nombre: "LG UltraGear 24GS60F-B",
    precio: 119000,
    imagen: "/assets/productos/MO1.jpg",
    descripcion:
      "El LG UltraGear 24GS60F-B es un monitor diseñado para gamers que buscan un rendimiento superior y una experiencia visual inmersiva.",
    miniaturas: [
      "/assets/productos/MO1.1.jpg",
      "/assets/productos/MO1.2.jpg",
      "/assets/productos/MO1.3.jpg",
    ],
    atributo: "Monitor",
    especificaciones: {
      Tipo: "Monitor Gaming",
      Tamaño: "24 pulgadas",
      Resolución: "Full HD (1920x1080)",
      "Frecuencia de refresco": "180 Hz",
      "Tiempo de respuesta": "1 ms",
    },
  },
  {
    id: 11,
    nombre: "Xiaomi A27Qi",
    precio: 124000,
    imagen: "/assets/productos/MO2.jpg",
    descripcion:
      "El Monitor Xiaomi A27Qi es una pantalla de 27 pulgadas que ofrece una experiencia visual de alta calidad.",
    miniaturas: [
      "/assets/productos/MO2.1.jpg",
      "/assets/productos/MO2.2.jpg",
      "/assets/productos/MO2.3.jpg",
    ],
    atributo: "Monitor",
    especificaciones: {
      Tipo: "Monitor de escritorio",
      Tamaño: "27 pulgadas",
      Resolución: "QHD (2560x1440)",
      "Frecuencia de refresco": "100 Hz",
      Brillo: "300 nits",
    },
  },
  {
    id: 12,
    nombre: "Xiaomi G34WQi",
    precio: 240000,
    imagen: "/assets/productos/MO3.jpg",
    descripcion:
      "El Monitor Gamer Xiaomi G34WQi es una pantalla curva ultrapanorámica de 34 pulgadas diseñada para ofrecer una experiencia visual inmersiva.",
    miniaturas: [
      "/assets/productos/MO3.1.jpg",
      "/assets/productos/MO3.2.jpg",
      "/assets/productos/MO3.3.jpg",
    ],
    atributo: "Monitor",
    especificaciones: {
      Tipo: "Monitor Gaming Curvo Ultrawide",
      Tamaño: "34 pulgadas",
      Resolución: "WQHD (3440x1440)",
      "Frecuencia de refresco": "180 Hz",
      Curvatura: "1500R",
    },
  },
];

export default function ProductoDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id);
  const producto = productos.find((p) => p.id === productId);

  const [imagenPrincipal, setImagenPrincipal] = useState(
    () => producto?.imagen ?? null
  );
  const [cantidad, setCantidad] = useState(1);
  const { addToCart } = useCart();

  // Inicializar la imagen principal cuando el producto se carga
  useEffect(() => {
    if (producto) {
      setImagenPrincipal(producto.imagen);
    }
  }, [producto]);

  // Si no se encuentra el producto
  if (!producto) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe.</p>
          <Link href="/productos" className="btn btn-primary">
            Volver a Productos
          </Link>
        </div>
      </Container>
    );
  }

  const cambiarImagen = (nuevaImagen) => {
    setImagenPrincipal(nuevaImagen);
  };

  const handleAddToCart = () => {
    addToCart(producto, cantidad);
    alert(`¡${cantidad} x ${producto.nombre} agregado al carrito!`);
  };

  // Todas las imágenes disponibles
  const todasLasImagenes = [producto.imagen, ...(producto.miniaturas || [])];

  return (
    <Container className="py-4">
      {/* Migas de pan */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} href="/">
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} href="/productos">
          Productos
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        {/* Columna de imágenes */}
        <Col md={6}>
          <div className="mb-4">
            {/* Imagen principal */}
            {imagenPrincipal ? (
              <img
                src={imagenPrincipal}
                alt={producto.nombre}
                className="img-fluid rounded border"
                style={{
                  width: "100%",
                  height: "400px",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/500x400/cccccc/969696?text=Imagen+No+Disponible";
                }}
              />
            ) : (
              <div
                className="bg-light rounded d-flex align-items-center justify-content-center"
                style={{ width: "100%", height: "400px" }}
              >
                <span className="text-muted">Imagen no disponible</span>
              </div>
            )}
          </div>

          {/* Miniaturas */}
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {todasLasImagenes.map((imagen, index) => (
              <div key={index} className="text-center">
                <img
                  src={imagen}
                  alt={`${producto.nombre} vista ${index + 1}`}
                  className={`img-thumbnail ${
                    imagenPrincipal === imagen
                      ? "border-primary border-3"
                      : "border-secondary"
                  }`}
                  style={{
                    width: "70px",
                    height: "70px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => cambiarImagen(imagen)}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/70x70/cccccc/969696?text=X";
                  }}
                />
              </div>
            ))}
          </div>
        </Col>

        {/* Columna de información */}
        <Col md={6}>
          <div className="mb-3">
            <Badge bg="primary" className="mb-2">
              {producto.atributo}
            </Badge>
            <h1 className="h2">{producto.nombre}</h1>
            <h2 className="h3 text-primary mb-3">
              ${producto.precio.toLocaleString("es-CL")}
            </h2>
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <h4 className="h5">Descripción</h4>
            <p className="text-muted">{producto.descripcion}</p>
          </div>

          {/* Especificaciones */}
          {producto.especificaciones && (
            <div className="mb-4">
              <h4 className="h5">Especificaciones</h4>
              <Card>
                <Card.Body>
                  {Object.entries(producto.especificaciones).map(
                    ([key, value]) => (
                      <div key={key} className="row border-bottom py-2">
                        <div className="col-4 fw-bold">{key}</div>
                        <div className="col-8">{value}</div>
                      </div>
                    )
                  )}
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Selector de cantidad */}
          <div className="mb-4">
            <Row className="align-items-center">
              <Col xs="auto">
                <label className="form-label fw-bold">Cantidad:</label>
              </Col>
              <Col xs="auto">
                <input
                  type="number"
                  className="form-control"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  style={{ width: "80px" }}
                />
              </Col>
            </Row>
          </div>

          {/* Botones de acción */}
          <div className="d-grid gap-2 d-md-flex">
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              className="flex-fill"
            >
              🛒 Agregar al Carrito
            </Button>
            <Button variant="outline-dark" size="lg" className="flex-fill">
              💝 Agregar a Favoritos
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
