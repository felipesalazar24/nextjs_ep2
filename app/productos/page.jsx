"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Pagination,
} from "react-bootstrap";
import Link from "next/link";
import { getProductos } from "../../lib/products"; // <- CORRECTO desde app/productos -> ../../lib/products
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 40;

const ProductImage = ({ src, alt, style }) => {
  const [imgSrc, setImgSrc] = useState(src);
  useEffect(() => setImgSrc(src), [src]);
  const handleError = () =>
    setImgSrc(
      "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible"
    );
  return (
    <Card.Img
      variant="top"
      src={imgSrc}
      alt={alt}
      style={style}
      onError={handleError}
    />
  );
};

export default function ProductosPage() {
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Cargar productos desde el wrapper (síncrono)
  const productos = useMemo(() => {
    try {
      return Array.isArray(getProductos()) ? getProductos() : [];
    } catch {
      return [];
    }
  }, []);

  const totalItems = productos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // SÓLO slice de los 40 items de la página actual (no acumulación)
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return productos.slice(start, end);
  }, [productos, page]);

  // scroll to top al cambiar de página
  useEffect(() => {
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleAddToCart = (producto) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    addToCart(producto, 1);
    alert(`${producto.nombre} agregado al carrito`);
  };

  const getPageItems = () => {
    const pages = [];
    const maxButtons = 7;
    let start = Math.max(1, page - 3);
    let end = Math.min(totalPages, page + 3);

    if (page <= 4) {
      start = 1;
      end = Math.min(totalPages, maxButtons);
    } else if (page + 3 >= totalPages) {
      end = totalPages;
      start = Math.max(1, totalPages - (maxButtons - 1));
    }
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Nuestros Productos</h1>
        <p className="lead text-muted">
          Descubre la mejor selección de productos gaming
        </p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong>
            Mostrando {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalItems)} -{" "}
            {Math.min(page * ITEMS_PER_PAGE, totalItems)}
          </strong>{" "}
          de {totalItems} productos
        </div>

        <div>
          <Pagination className="mb-0">
            <Pagination.First
              onClick={() => setPage(1)}
              disabled={page === 1}
            />
            <Pagination.Prev
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            {getPageItems().map((p) => (
              <Pagination.Item
                key={p}
                active={p === page}
                onClick={() => setPage(p)}
              >
                {p}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
            <Pagination.Last
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      </div>

      <Row className="g-4">
        {currentItems.map((producto) => (
          <Col key={producto.id} sm={6} md={4} lg={3}>
            <Card className="h-100 shadow-sm">
              <ProductImage
                src={producto.imagen}
                alt={producto.nombre}
                style={{ height: 180, objectFit: "contain", padding: 12 }}
              />
              <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{producto.nombre}</h5>
                  <Badge bg="secondary">{producto.atributo}</Badge>
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddToCart(producto)}
                  >
                    Agregar al Carrito
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          Página {page} de {totalPages}
        </div>
        <div>
          <Pagination className="mb-0">
            <Pagination.First
              onClick={() => setPage(1)}
              disabled={page === 1}
            />
            <Pagination.Prev
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            />
            {getPageItems().map((p) => (
              <Pagination.Item
                key={p}
                active={p === page}
                onClick={() => setPage(p)}
              >
                {p}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            />
            <Pagination.Last
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      </div>
    </Container>
  );
}
