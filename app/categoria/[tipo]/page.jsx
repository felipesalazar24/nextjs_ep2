"use client";

import React, { useMemo } from "react";
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
import { useParams } from "next/navigation";
import { getProductos } from "../../../lib/products"; // wrapper que expone los productos

// Configuración visual y textos por categoría
const CATEGORIES = [
  {
    key: "mouse",
    title: "Mouse Gaming",
    description: "Precisión y velocidad para gamers profesionales",
    btnVariant: "primary",
  },
  {
    key: "teclado",
    title: "Teclados Mecánicos",
    description: "Respuesta táctil y durabilidad excepcional",
    btnVariant: "success",
  },
  {
    key: "audifono",
    title: "Audífonos Gaming",
    description: "Sonido envolvente y comodidad para largas sesiones",
    btnVariant: "warning",
  },
  {
    key: "monitor",
    title: "Monitores Gaming",
    description: "Alta tasa de refresco y colores vibrantes",
    btnVariant: "dark",
  },
];

export default function CategoriaPage() {
  const params = useParams();
  const tipoCategoria = params.tipo || "";
  const productos = getProductos();

  // Normalizar: el parámetro de ruta puede venir en minúsculas
  const tipoLower = String(tipoCategoria).toLowerCase();

  // Filtrar productos por categoría (ignora mayúsculas / minúsculas)
  const productosCategoria = productos.filter(
    (producto) =>
      String(producto.atributo || producto.categoria || "").toLowerCase() ===
      tipoLower
  );

  const getCategoryVariant = (atributo) => {
    const variants = {
      mouse: "primary",
      teclado: "success",
      audifono: "warning",
      monitor: "info",
    };
    return variants[atributo] || "secondary";
  };

  // Preparar datos para los "cards" de navegación de categorías:
  // - contar productos por categoría
  // - elegir una imagen representativa (primer producto de la categoría)
  const categoriaStats = useMemo(() => {
    const map = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = { count: 0, image: null, meta: cat };
    }
    for (const p of productos) {
      const key = String(p.atributo || p.categoria || "").toLowerCase();
      if (!map[key]) continue;
      map[key].count += 1;
      if (!map[key].image && p.imagen) map[key].image = p.imagen;
    }
    return map;
  }, [productos]);

  // Mostrar cards de categorías EXCLUYENDO la categoría activa
  const categoriasParaMostrar = CATEGORIES.filter((c) => c.key !== tipoLower);

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/categoria">Categorías</Breadcrumb.Item>
        <Breadcrumb.Item active>{tipoCategoria}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 text-capitalize">{tipoCategoria}</h2>

      {productosCategoria.length > 0 ? (
        <Row className="g-4">
          {productosCategoria.map((producto) => (
            <Col key={producto.id} md={4} lg={3}>
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={producto.imagen}
                  style={{ height: 160, objectFit: "contain", padding: 12 }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen";
                  }}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="mb-0">{producto.nombre}</h5>
                    <Badge
                      bg={getCategoryVariant(
                        String(
                          producto.atributo || producto.categoria || ""
                        ).toLowerCase()
                      )}
                    >
                      {producto.atributo || producto.categoria}
                    </Badge>
                  </div>
                  <p className="text-primary fw-bold mb-3">
                    ${Number(producto.precio).toLocaleString("es-CL")}
                  </p>

                  <div className="mt-auto d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-dark btn-sm"
                    >
                      Ver Detalles
                    </Link>
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Agregar al Carrito
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row>
          <Col className="text-center">
            <div className="py-5">
              <h3 className="h4 text-muted">
                No hay productos en esta categoría
              </h3>
              <Link href="/productos" className="btn btn-primary mt-3">
                Ver Todos
              </Link>
            </div>
          </Col>
        </Row>
      )}

      {/* ---------------------------
          Panel de categorías visual (cards) con imagen, badge y botón "Explorar Categoría"
          SE EXCLUYE la categoría activa (no aparece entre los cards)
          --------------------------- */}
      <div className="mt-5">
        <h4 className="mb-3">Explorar categorías</h4>
        <Row className="g-4">
          {categoriasParaMostrar.map((cat) => {
            const stat = categoriaStats[cat.key] || { count: 0, image: null };
            const imgSrc =
              stat.image ||
              `/assets/category/${cat.key}.png` ||
              "https://via.placeholder.com/400x300?text=Categoria";
            const btnVariant = cat.btnVariant || "secondary";

            return (
              <Col key={cat.key} md={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <div style={{ position: "relative" }}>
                    <Card.Img
                      variant="top"
                      src={imgSrc}
                      style={{
                        height: 240,
                        objectFit: "contain",
                        padding: 20,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300/ffffff/cccccc?text=Imagen+Categoría";
                      }}
                    />
                    <Badge
                      bg="primary"
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 5,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                      }}
                    >
                      {stat.count} productos
                    </Badge>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <h5 className="mb-1 text-center">{cat.title}</h5>
                    <p className="text-muted text-center small mb-3">
                      {cat.description}
                    </p>

                    <div className="mt-auto d-grid">
                      <Link
                        href={`/categoria/${String(cat.key).toLowerCase()}`}
                        className={`btn btn-${btnVariant}`}
                      >
                        Explorar Categoría
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </Container>
  );
}
