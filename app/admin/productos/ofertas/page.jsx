"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

/**
 * Página administrativa de Ofertas (app/admin/productos/ofertas/page.jsx)
 *
 * - Requiere usuario admin (detección flexible).
 * - Lista ofertas (server + localStorage fallback).
 * - Permite crear oferta (modal): seleccionar producto, porcentaje o precio fijo.
 * - Crea la oferta vía POST /api/offers (cae a localStorage si falla).
 * - Permite eliminar oferta vía DELETE /api/offers/[id] (y limpiar localStorage).
 *
 * Copia y pega este archivo en app/admin/productos/ofertas/page.jsx
 */

function userIsAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.admin === true) return true;
  const role = (user.role || user.rol || user.roleName || "")
    .toString()
    .toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (
    Array.isArray(user.roles) &&
    user.roles.some((r) => String(r).toLowerCase() === "admin")
  )
    return true;
  if (
    Array.isArray(user.permissions) &&
    (user.permissions.includes("admin") || user.permissions.includes("ADMIN"))
  )
    return true;
  const nameCheck = (user.name || user.nombre || user.displayName || "")
    .toString()
    .toLowerCase();
  if (nameCheck.includes("admin")) return true;
  return false;
}

export default function AdminOffersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [serverOffers, setServerOffers] = useState([]);
  const [createdOffers, setCreatedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalProductId, setModalProductId] = useState("");
  const [modalType, setModalType] = useState("percent"); // 'percent' | 'price'
  const [modalValue, setModalValue] = useState("");
  const [modalError, setModalError] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  // Avoid immediate redirect while auth context hydrates.
  useEffect(() => {
    let t;
    if (user === null) {
      t = setTimeout(() => {
        router.push("/login");
      }, 1200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [user, router]);

  // Load products and offers
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes, oRes] = await Promise.all([
          fetch("/api/productos"),
          fetch("/api/offers").catch(() => null),
        ]);

        if (!pRes.ok) {
          const data = await pRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar productos");
        }
        const prodData = await pRes.json().catch(() => []);
        let offersData = [];
        if (oRes && oRes.ok) {
          offersData = await oRes.json().catch(() => []);
        }

        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem("createdOffers")
            : null;
        const parsed = stored ? JSON.parse(stored) : [];

        if (!mounted) return;
        setProductos(Array.isArray(prodData) ? prodData : []);
        setServerOffers(Array.isArray(offersData) ? offersData : []);
        setCreatedOffers(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error al cargar datos");
        setProductos([]);
        setServerOffers([]);
        setCreatedOffers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Combine offers from server and local created offers (admin)
  const ofertas = useMemo(() => {
    const map = new Map();

    for (const o of serverOffers || []) {
      const pid = String(o.productId ?? o.id ?? o.product?.id ?? "");
      if (!pid) continue;
      map.set(pid, { ...o, source: "server" });
    }

    for (const o of createdOffers || []) {
      const pid = String(o.productId ?? "");
      if (!pid) continue;
      map.set(pid, { ...o, source: "admin" });
    }

    const arr = [];
    for (const [pid, o] of map.entries()) {
      const prod = productos.find(
        (p) => String(p.id ?? p._id ?? p.sku) === pid
      );
      if (!prod) continue;
      arr.push({
        productId: pid,
        product: prod,
        oldPrice: o.oldPrice ?? prod.precio ?? null,
        newPrice: o.newPrice ?? null,
        percent:
          o.percent ??
          (o.oldPrice && o.newPrice
            ? Math.round(((o.oldPrice - o.newPrice) / o.oldPrice) * 100)
            : 0),
        source: o.source || "admin",
        raw: o,
      });
    }

    arr.sort(
      (a, b) =>
        (b.percent || 0) - (a.percent || 0) ||
        (a.newPrice || 0) - (b.newPrice || 0)
    );
    return arr;
  }, [serverOffers, createdOffers, productos]);

  const openCreateModal = () => {
    setModalProductId("");
    setModalType("percent");
    setModalValue("");
    setModalError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setModalProductId("");
    setModalType("percent");
    setModalValue("");
    setModalError(null);
  };

  // Create offer: try POST /api/offers, fallback to localStorage
  const submitCreateOffer = async () => {
    setModalError(null);
    if (!modalProductId) {
      setModalError("Selecciona un producto");
      return;
    }
    const producto = productos.find(
      (p) => String(p.id ?? p._id ?? p.sku) === String(modalProductId)
    );
    if (!producto) {
      setModalError("Producto no válido");
      return;
    }
    const basePrice = Number(producto.precio || 0);
    if (!basePrice || basePrice <= 0) {
      setModalError("El producto no tiene precio válido");
      return;
    }

    const v = Number(modalValue);
    let newPrice = null;
    let percent = null;

    if (modalType === "percent") {
      if (isNaN(v) || v <= 0 || v >= 100) {
        setModalError("Ingresa porcentaje válido (1-99)");
        return;
      }
      percent = Math.round(v);
      newPrice = Math.round(basePrice * (1 - percent / 100));
    } else {
      if (isNaN(v) || v <= 0 || v >= basePrice) {
        setModalError("Ingresa precio válido menor al precio original");
        return;
      }
      newPrice = Math.round(v);
      percent = Math.round(((basePrice - newPrice) / basePrice) * 100);
    }

    const offerRecord = {
      productId: String(modalProductId),
      newPrice,
      percent,
      oldPrice: basePrice,
      createdAt: new Date().toISOString(),
    };

    setModalSaving(true);
    let saved = false;
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerRecord),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json && json.record) {
          setServerOffers((prev) => [...(prev || []), json.record]);
        } else {
          setServerOffers((prev) => [...(prev || []), offerRecord]);
        }
        saved = true;
      } else {
        console.warn("POST /api/offers responded:", res.status);
      }
    } catch (err) {
      console.warn("Error POST /api/offers:", err);
    }

    if (!saved) {
      // fallback to localStorage
      try {
        const raw = localStorage.getItem("createdOffers");
        const parsed = raw ? JSON.parse(raw) : [];
        parsed.push(offerRecord);
        localStorage.setItem("createdOffers", JSON.stringify(parsed));
        setCreatedOffers(parsed);
        saved = true;
      } catch (err) {
        console.error("No se pudo almacenar oferta en localStorage", err);
        setModalError("No se pudo guardar la oferta (ver consola)");
        setModalSaving(false);
        return;
      }
    }

    if (saved) {
      setSuccessMsg("Oferta creada correctamente");
      setTimeout(() => setSuccessMsg(null), 3000);
      closeCreateModal();
    }
    setModalSaving(false);
  };

  const handleDeleteOffer = async (productId) => {
    const pid = String(productId);
    // optimistic updates
    setServerOffers((prev) =>
      (prev || []).filter((o) => String(o.productId) !== pid)
    );
    try {
      const stored = localStorage.getItem("createdOffers");
      const parsed = stored ? JSON.parse(stored) : [];
      const filtered = parsed.filter((o) => String(o.productId) !== pid);
      localStorage.setItem("createdOffers", JSON.stringify(filtered));
      setCreatedOffers(filtered);
    } catch (err) {
      console.warn("Error updating localStorage", err);
    }
    try {
      await fetch(`/api/offers/${encodeURIComponent(pid)}`, {
        method: "DELETE",
      });
    } catch (err) {
      // ignore
    }
  };

  // auth states handling
  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (user === null) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          Comprobando sesión... serás redirigido al login si no hay sesión.
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Acceso denegado. Necesitas permisos de administrador para ver esta
          página.
        </Alert>
        <Link href="/admin" className="btn btn-secondary">
          Volver al panel
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3 className="mb-0">Ofertas (Admin)</h3>
          <small className="text-muted">
            Crear y gestionar ofertas de productos
          </small>
        </div>

        <div className="d-flex gap-2">
          <Link href="/admin" className="btn btn-outline-secondary">
            Volver al panel
          </Link>
          <Link href="/admin/productos" className="btn btn-outline-secondary">
            Volver a Productos
          </Link>
          <Button variant="primary" onClick={openCreateModal}>
            Crear Oferta
          </Button>
        </div>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Ofertas activas</h5>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {!loading && ofertas.length === 0 && (
            <div className="text-center text-muted py-4">
              No hay ofertas activas.
            </div>
          )}

          {!loading && ofertas.length > 0 && (
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Precio original</th>
                  <th>Precio oferta</th>
                  <th>Descuento</th>
                  <th>Fuente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o, idx) => (
                  <tr key={String(o.productId)}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={
                            o.product.imagen ||
                            "/assets/productos/placeholder.png"
                          }
                          alt={o.product.nombre}
                          style={{
                            width: 56,
                            height: 40,
                            objectFit: "contain",
                          }}
                          onError={(e) =>
                            (e.target.src = "/assets/productos/placeholder.png")
                          }
                        />
                        <div>
                          <div>{o.product.nombre}</div>
                          <small className="text-muted">
                            {o.product.atributo || o.product.categoria}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>${Number(o.oldPrice || 0).toLocaleString("es-CL")}</td>
                    <td>${Number(o.newPrice || 0).toLocaleString("es-CL")}</td>
                    <td>{o.percent ? `-${o.percent}%` : "-"}</td>
                    <td>
                      <Badge bg={o.source === "server" ? "info" : "secondary"}>
                        {o.source}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          href={`/productos/${o.product.id}`}
                          className="btn btn-outline-dark btn-sm"
                        >
                          Ver
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOffer(o.productId)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Crear Oferta */}
      <Modal show={showCreateModal} onHide={closeCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Oferta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Producto</Form.Label>
              <Form.Select
                value={modalProductId}
                onChange={(e) => setModalProductId(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option
                    key={String(p.id ?? p._id ?? p.sku ?? p.nombre)}
                    value={String(p.id ?? p._id ?? p.sku ?? p.nombre)}
                  >
                    {p.nombre} — $
                    {Number(p.precio || 0).toLocaleString("es-CL")}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo de oferta</Form.Label>
              <div>
                <Form.Check
                  inline
                  label="Porcentaje (%)"
                  name="tipo"
                  type="radio"
                  id="tipo-percent"
                  checked={modalType === "percent"}
                  onChange={() => setModalType("percent")}
                />
                <Form.Check
                  inline
                  label="Precio fijo"
                  name="tipo"
                  type="radio"
                  id="tipo-price"
                  checked={modalType === "price"}
                  onChange={() => setModalType("price")}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {modalType === "percent"
                  ? "Porcentaje de descuento (%)"
                  : "Nuevo precio (ej: 19990)"}
              </Form.Label>
              <Form.Control
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder={modalType === "percent" ? "10" : "19990"}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeCreateModal}
            disabled={modalSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={submitCreateOffer}
            disabled={modalSaving}
          >
            {modalSaving ? "Guardando..." : "Crear Oferta"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
