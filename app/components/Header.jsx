"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Navbar, Nav, Container, Badge, Dropdown } from "react-bootstrap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function HeaderComponent() {
  const pathname = usePathname();
  const cart = useCart();
  const auth = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // snapshot seguro del usuario
  const user = auth?.user ?? null;
  const logout = typeof auth?.logout === "function" ? auth.logout : () => {};

  // calcular itemsCount sólo en cliente (mounted) y memoizado
  const itemsCount = useMemo(() => {
    if (!mounted) return 0;
    try {
      if (typeof cart?.getTotalItems === "function") {
        return Number(cart.getTotalItems()) || 0;
      }
    } catch (e) {
      console.error("getTotalItems error", e);
    }
    return 0;
  }, [cart, mounted]);

  const handleLogout = useCallback(() => {
    try {
      logout();
    } catch (err) {
      console.error("Logout error", err);
    }
  }, [logout]);

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
          🎮 GameTech
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="custom-toggler"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              href="/"
              className={`nav-link-custom ${pathname === "/" ? "active" : ""}`}
            >
              Home
            </Nav.Link>
            <Nav.Link
              href="/productos"
              className={`nav-link-custom ${
                pathname === "/productos" ? "active" : ""
              }`}
            >
              Productos
            </Nav.Link>
            <Nav.Link
              href="/categoria"
              className={`nav-link-custom ${
                pathname === "/categoria" || pathname?.includes("/categoria/")
                  ? "active"
                  : ""
              }`}
            >
              Categorías
            </Nav.Link>
            <Nav.Link
              href="/ofertas"
              className={`nav-link-custom ${
                pathname === "/ofertas" ? "active" : ""
              }`}
            >
              Ofertas
            </Nav.Link>
            <Nav.Link
              href="/nosotros"
              className={`nav-link-custom ${
                pathname === "/nosotros" ? "active" : ""
              }`}
            >
              Nosotros
            </Nav.Link>
            <Nav.Link
              href="/blog"
              className={`nav-link-custom ${
                pathname === "/blog" ? "active" : ""
              }`}
            >
              Blog
            </Nav.Link>
            <Nav.Link
              href="/contacto"
              className={`nav-link-custom ${
                pathname === "/contacto" ? "active" : ""
              }`}
            >
              Contacto
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto d-flex align-items-center header-actions">
            {mounted && user ? (
              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-light"
                  id="dropdown-user"
                  className="d-flex align-items-center"
                >
                  👤 {user.nombre || user.email}
                  {(user.rol === "admin" || user.isAdmin) && (
                    <Badge bg="warning" text="dark" className="ms-1">
                      Admin
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.ItemText>
                    <small>
                      Conectado como{" "}
                      <strong>{user.nombre || user.email}</strong>
                    </small>
                  </Dropdown.ItemText>

                  {(user.rol === "admin" || user.isAdmin) && (
                    <>
                      <Dropdown.Item as="div">
                        <Link href="/admin" className="dropdown-item">
                          ⚙️ Administrar
                        </Link>
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </>
                  )}

                  <Dropdown.Item onClick={handleLogout}>
                    🚪 Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-outline-light btn-sm me-2 login-btn"
                >
                  Login
                </Link>
                <Link
                  href="/registro"
                  className="btn btn-primary btn-sm me-2 register-btn"
                >
                  Registro
                </Link>
              </>
            )}

            <Link
              href="/carrito"
              className="btn btn-outline-warning btn-sm cart-btn position-relative"
            >
              🛒 Carrito
              {itemsCount > 0 && (
                <Badge
                  bg="light"
                  text="dark"
                  className="cart-badge position-absolute top-0 start-100 translate-middle"
                >
                  {itemsCount}
                </Badge>
              )}
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default React.memo(HeaderComponent);
