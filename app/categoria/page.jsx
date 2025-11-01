"use client";

import React, { useMemo } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Link from "next/link";
import { getProductos } from "../../lib/products"; // desde app/categoria -> ../../lib/products

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

export default function CategoriasIndexPage() {
  // cargar todos los productos (wrapper síncrono que lee data/productos.json)
  const productos = useMemo(() => {
    try {
      return Array.isArray(getProductos()) ? getProductos() : [];
    } catch {
      return [];
    }
  }, []);

  // calcular conteo e imagen representativa por categoría
  const stats = useMemo(() => {
    const map = {};
    // inicializar keys con 0
    for (const c of CATEGORIES) {
      map[c.key] = { count: 0, image: null };
    }
    for (const p of productos) {
      const key = String(p.atributo || p.categoria || "").toLowerCase();
      if (!map[key]) continue;
      map[key].count += 1;
      if (!map[key].image && p.imagen) map[key].image = p.imagen;
    }
    return map;
  }, [productos]);

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold">Categorías</h1>
        <p className="text-muted">Explora por tipo de producto</p>
      </div>

      <Row className="g-4">
        {CATEGORIES.map((cat) => {
          const stat = stats[cat.key] || { count: 0, image: null };
          // prioridad: imagen representativa de productos > asset estático en /assets/category > placeholder
          const imgSrc =
            stat.image ||
            `/assets/category/${cat.key}.png` ||
            "https://via.placeholder.com/400x300?text=Categoria";
          const countLabel = `${stat.count} producto${
            stat.count === 1 ? "" : "s"
          }`;

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
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      zIndex: 5,
                      background: "#0d6efd",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                    }}
                  >
                    {countLabel}
                  </div>
                </div>

                <Card.Body className="d-flex flex-column">
                  <h5 className="mb-1 text-center">{cat.title}</h5>
                  <p className="text-muted text-center small mb-3">
                    {cat.description}
                  </p>

                  <div className="mt-auto d-grid">
                    <Link
                      href={`/categoria/${String(cat.key).toLowerCase()}`}
                      className={`btn btn-${cat.btnVariant}`}
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
      {/* Información adicional */}
      <Row className="mt-5">
        <Col className="text-center">
          <div className="bg-light rounded p-4">
            <h3 className="h4 mb-3">¿No encuentras lo que buscas?</h3>
            <p className="text-muted mb-3">
              Explora todos nuestros productos o contáctanos para asistencia
              personalizada
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Link href="/productos" className="btn btn-primary">
                Ver Todos los Productos
              </Link>
              <Link href="/contacto" className="btn btn-outline-secondary">
                Contactar Soporte
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
