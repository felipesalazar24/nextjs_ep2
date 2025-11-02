"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CarritoPage() {
  const { user } = useAuth();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCount,
    lastError,
    clearError,
  } = useCart();

  const total = useMemo(
    () =>
      (items || []).reduce((sum, it) => {
        const precio = Number(it.precio || 0);
        const cantidad = Number(it.cantidad || 0);
        return sum + precio * cantidad;
      }, 0),
    [items]
  );

  if (!user) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="text-center shadow-sm border-0 p-4">
              <h3>Debes iniciar sesión para ver y usar el carrito</h3>
              <p className="text-muted">
                El carrito se guarda por usuario y se restaurará automáticamente
                cuando inicies sesión.
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <Link href="/login" className="btn btn-primary">
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="btn btn-outline-secondary">
                  Crear cuenta
                </Link>
              </div>
              {lastError && (
                <Alert variant="danger" className="mt-3">
                  {lastError}{" "}
                  <Button variant="link" onClick={() => clearError()}>
                    Cerrar
                  </Button>
                </Alert>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col md={8}>
          <h2 className="mb-4">Carrito ({getCount()})</h2>

          {(!items || items.length === 0) && (
            <Card className="text-center shadow-sm border-0 p-4 mb-3">
              <h5>Tu carrito está vacío</h5>
              <p className="text-muted">
                Agrega productos desde la página de productos.
              </p>
              <Link href="/productos" className="btn btn-primary mt-2">
                Ver Productos
              </Link>
            </Card>
          )}

          {items.map((item) => (
            <Card key={item.id} className="mb-3 shadow-sm">
              <Card.Body className="d-flex align-items-center gap-3">
                <img
                  src={
                    item.imagen ||
                    item.thumbnail ||
                    "/assets/productos/placeholder.png"
                  }
                  alt={item.nombre}
                  style={{ width: 100, height: 100, objectFit: "contain" }}
                />
                <div className="flex-grow-1">
                  <h5 className="mb-1">{item.nombre}</h5>
                  <div className="text-primary fw-bold mb-2">
                    ${Number(item.precio || 0).toLocaleString("es-CL")}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      min={0}
                      value={item.cantidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || "0", 10);
                        if (isNaN(val)) return;
                        updateQuantity(item.id, val);
                      }}
                      style={{ width: 90 }}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
                <div className="text-end" style={{ minWidth: 140 }}>
                  <div className="text-muted">Subtotal</div>
                  <div className="fw-bold">
                    $
                    {(
                      Number(item.precio || 0) * Number(item.cantidad || 0) || 0
                    ).toLocaleString("es-CL")}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm">
            <h5>Resumen del pedido</h5>
            <hr />
            <div className="d-flex justify-content-between">
              <div>Productos</div>
              <div>{items.length}</div>
            </div>
            <div className="d-flex justify-content-between">
              <div>Cantidad total</div>
              <div>{getCount()}</div>
            </div>
            <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
              <div>Total</div>
              <div>${total.toLocaleString("es-CL")}</div>
            </div>

            <div className="d-grid gap-2 mt-3">
              <Link href="/checkout" className="btn btn-primary">
                Ir a pagar
              </Link>
              <Button variant="outline-secondary" onClick={() => clearCart()}>
                Vaciar carrito
              </Button>
            </div>
            {lastError && (
              <Alert variant="danger" className="mt-3">
                {lastError}
              </Alert>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
