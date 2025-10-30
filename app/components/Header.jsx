"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Nav, Container } from "react-bootstrap";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function HeaderDebug() {
  const pathname = usePathname();
  const cart = useCart();
  const auth = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    console.log("HEADER DEBUG: mounted true");
    // log snapshot of context API
    try {
      console.log("HEADER DEBUG: useAuth ->", {
        user: auth?.user,
        hydrated: auth?.hydrated,
      });
    } catch (e) {
      console.error("HEADER DEBUG: useAuth read error", e);
    }
    try {
      console.log("HEADER DEBUG: useCart ->", {
        cart: cart?.cart,
        getTotalItems:
          typeof cart?.getTotalItems === "function"
            ? cart.getTotalItems()
            : "no-fn",
      });
    } catch (e) {
      console.error("HEADER DEBUG: useCart read error", e);
    }
  }, []); // sólo al montar

  // También log en cada render para ver re-renders
  console.log("HEADER DEBUG: render", { mounted, user: auth?.user });

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="custom-navbar"
    >
      <Container>
        <Navbar.Brand href="/" className="fw-bold brand-logo">
          🎮 GameTech (debug)
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/" className={pathname === "/" ? "active" : ""}>
              Home
            </Nav.Link>
            <Nav.Link href="/productos">Productos</Nav.Link>
          </Nav>

          {/* Este div debe mostrar siempre su contenido (prueba de aislamiento) */}
          <div
            className="ms-auto d-flex align-items-center header-actions navbar-nav"
            id="header-actions-debug"
          >
            <span style={{ color: "#fff", marginRight: 8 }}>DEBUG:</span>

            {/* Mostrar siempre botones de fallback para comprobar si algo los elimina */}
            <Link href="/login" className="btn btn-outline-light btn-sm me-2">
              Login
            </Link>
            <Link href="/registro" className="btn btn-primary btn-sm me-2">
              Registro
            </Link>

            <button
              className="btn btn-outline-warning btn-sm"
              onClick={() => {
                try {
                  console.log("MANUAL LOG: auth", auth);
                  console.log("MANUAL LOG: cart", cart);
                } catch (e) {
                  console.error("MANUAL LOG error", e);
                }
              }}
            >
              🛒 Carrito (debug)
            </button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
