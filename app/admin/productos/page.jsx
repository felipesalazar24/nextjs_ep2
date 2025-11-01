"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  Modal,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Productos (actualizado para mostrar descuentos)
 * - Muestra descuento en la columna Precio: precio original (tachado) y debajo
 *   el precio con oferta + badge con % cuando corresponda.
 * - En el modal de detalle también muestra el precio tachado y el precio en oferta
 *   con el badge.
 * - No crea archivos nuevos; la lógica de ofertas está inline (lectura de /api/offers
 *   + fallback a localStorage.createdOffers). Admin local (createdOffers) sobrescribe server.
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

/* ---------- Helpers para ofertas (INLINE) ---------- */
const loadOffers = async () => {
  let serverOffers = [];
  try {
    const res = await fetch("/api/offers").catch(() => null);
    if (res && res.ok) serverOffers = await res.json().catch(() => []);
  } catch (err) {
    serverOffers = [];
  }

  let created = [];
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("createdOffers");
      created = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    created = [];
  }

  const map = new Map();
  for (const o of serverOffers || []) {
    const pid = String(o.productId ?? o.id ?? "").trim();
    if (!pid) continue;
    map.set(pid, { ...o, source: "server" });
  }
  for (const o of created || []) {
    const pid = String(o.productId ?? "").trim();
    if (!pid) continue;
    map.set(pid, { ...o, source: "admin" });
  }
  return { offersArray: Array.from(map.values()), offersMap: map };
};

const getOfferForProduct = (offersMap, product) => {
  if (!offersMap || !product) return null;
  const pid = String(product.id ?? product._id ?? product.sku ?? "").trim();
  return offersMap.get(pid) || null;
};

const getEffectivePrice = (product, offer) => {
  const raw = Number(product.precio ?? product.price ?? 0) || 0;
  if (!offer) return { oldPrice: null, price: raw, percent: 0 };
  const oldPrice = Number(offer.oldPrice ?? raw) || raw;
  let price = Number(offer.newPrice ?? 0);
  let percent = Number(offer.percent ?? 0);

  if (!price && percent && oldPrice)
    price = Math.round(oldPrice * (1 - percent / 100));
  if (!percent && price && oldPrice)
    percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  if (!price || price <= 0) price = raw;

  return { oldPrice: oldPrice || null, price, percent: percent || 0 };
};
/* --------------------------------------------------- */

export default function AdminProductosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // offers state
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  // While auth may still be hydrating, avoid redirecting immediately.
  useEffect(() => {
    if (typeof user === "undefined") return;
    if (user === null) {
      const t = setTimeout(() => {
        router.push("/login");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      setOffersLoading(true);
      try {
        const [resProd] = await Promise.all([
          fetch("/api/productos"),
          // keep offers fetch inside loadOffers below (we call it afterwards)
        ]);

        if (!resProd.ok) {
          const data = await resProd.json().catch(() => ({}));
          throw new Error(data.error || "Error al obtener productos");
        }
        const dataProd = await resProd.json().catch(() => []);

        // load offers (server + local)
        const { offersMap: om } = await loadOffers();

        if (!mounted) return;
        setProductos(Array.isArray(dataProd) ? dataProd : []);
        setOffersMap(om);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Error desconocido");
      } finally {
        if (mounted) {
          setLoading(false);
          setOffersLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer."))
      return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar producto");
      }
      setProductos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (p) => {
    setDetailProduct(p);
    const main =
      p.imagen ||
      (Array.isArray(p.miniaturas) && p.miniaturas.length
        ? p.miniaturas[0]
        : null);
    setSelectedImage(main);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailProduct(null);
    setSelectedImage(null);
  };

  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  // While auth is loading: spinner
  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  // If not logged (transient): show a message while the redirect (scheduled) happens
  if (user === null) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          Comprobando sesión... serás redirigido al login si no hay sesión.
        </Alert>
      </Container>
    );
  }

  // If logged but not admin: show unified access denied UI
  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          Acceso denegado. Necesitas permisos de administrador para ver esta
          página.
        </Alert>

        <div>
          <a href="/" className="btn btn-secondary">
            Volver al inicio
          </a>
        </div>
      </Container>
    );
  }

  // Admin UI
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={12}>
          <Card className="shadow border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Productos</h3>
                <div>
                  <Button
                    variant="outline-primary"
                    href="/admin"
                    className="me-2"
                  >
                    Volver al panel
                  </Button>

                  <Button
                    variant="info"
                    href="/admin/productos/ofertas"
                    className="me-2"
                  >
                    Gestionar Ofertas
                  </Button>

                  <Button variant="primary" href="/admin/productos/crear">
                    Crear Producto
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status" />
                </div>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              {!loading && !error && productos.length === 0 && (
                <Alert variant="info">No hay productos registrados.</Alert>
              )}

              {!loading && !error && productos.length > 0 && (
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: 90 }}>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, idx) => {
                      const offer = getOfferForProduct(offersMap, p);
                      const ef = getEffectivePrice(p, offer);
                      return (
                        <tr key={p.id ?? p._id ?? idx}>
                          <td style={{ width: 40 }}>{idx + 1}</td>
                          <td style={{ width: 90 }}>
                            {p.imagen ? (
                              <img
                                src={p.imagen}
                                alt={p.nombre}
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  background: "#f5f5f5",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  background: "#f5f5f5",
                                  borderRadius: 6,
                                }}
                              />
                            )}
                          </td>
                          <td>{p.nombre || "-"}</td>
                          <td>{p.atributo || p.categoria || "-"}</td>

                          {/* Precio: mostrar precio original (tachado) y debajo el precio de oferta + badge */}
                          <td>
                            {ef && ef.oldPrice ? (
                              <div>
                                <div>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#777",
                                    }}
                                  >
                                    $
                                    {Number(ef.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center mt-1">
                                  <div
                                    style={{
                                      color: "#0d6efd",
                                      fontWeight: 700,
                                      marginRight: 8,
                                    }}
                                  >
                                    ${Number(ef.price).toLocaleString("es-CL")}
                                  </div>
                                  {ef.percent ? (
                                    <Badge bg="danger">-{ef.percent}%</Badge>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {typeof p.precio !== "undefined"
                                  ? `$ ${p.precio}`
                                  : "-"}
                              </div>
                            )}
                          </td>

                          <td>
                            {typeof p.stock !== "undefined" ? p.stock : "-"}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => openDetail(p)}
                            >
                              Ver
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                            >
                              {deletingId === p.id ? "Eliminando…" : "Eliminar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}

              <Modal show={showDetail} onHide={closeDetail} centered size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Detalle del producto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {detailProduct ? (
                    <Row>
                      <Col
                        md={5}
                        className="d-flex flex-column align-items-center"
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt={detailProduct.nombre}
                            style={{
                              width: "100%",
                              maxHeight: 360,
                              objectFit: "contain",
                              background: "#fff",
                              borderRadius: 6,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: 360,
                              background: "#f5f5f5",
                              borderRadius: 6,
                            }}
                          />
                        )}

                        <div className="d-flex gap-2 mt-3 flex-wrap justify-content-center">
                          {detailProduct.imagen && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedImage(detailProduct.imagen)
                              }
                              className="border-0 p-0"
                              style={{ background: "transparent" }}
                            >
                              <img
                                src={detailProduct.imagen}
                                alt="mini"
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  border:
                                    selectedImage === detailProduct.imagen
                                      ? "2px solid #0d6efd"
                                      : "1px solid #ddd",
                                  borderRadius: 6,
                                }}
                              />
                            </button>
                          )}

                          {Array.isArray(detailProduct.miniaturas) &&
                            detailProduct.miniaturas.map((m, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedImage(m)}
                                className="border-0 p-0"
                                style={{ background: "transparent" }}
                              >
                                <img
                                  src={m}
                                  alt={`mini-${i}`}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: "cover",
                                    border:
                                      selectedImage === m
                                        ? "2px solid #0d6efd"
                                        : "1px solid #ddd",
                                    borderRadius: 6,
                                  }}
                                />
                              </button>
                            ))}
                        </div>
                      </Col>

                      <Col md={7}>
                        <h5>{detailProduct.nombre || "-"}</h5>
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {detailProduct.atributo ||
                            detailProduct.categoria ||
                            "-"}
                        </p>

                        {/* Precio en modal: mostrar tachado + oferta si existe */}
                        <p>
                          <strong>Precio:</strong>{" "}
                          {(() => {
                            const offer = getOfferForProduct(
                              offersMap,
                              detailProduct
                            );
                            const ef = getEffectivePrice(detailProduct, offer);
                            if (ef && ef.oldPrice) {
                              return (
                                <>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#777",
                                      marginRight: 8,
                                    }}
                                  >
                                    $
                                    {Number(ef.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                  <span
                                    style={{
                                      color: "#0d6efd",
                                      fontWeight: 700,
                                    }}
                                  >
                                    ${Number(ef.price).toLocaleString("es-CL")}
                                  </span>
                                  {ef.percent ? (
                                    <Badge bg="danger" className="ms-2">
                                      -{ef.percent}%
                                    </Badge>
                                  ) : null}
                                </>
                              );
                            }
                            return typeof detailProduct.precio !== "undefined"
                              ? `$ ${detailProduct.precio}`
                              : "-";
                          })()}
                        </p>

                        <p>
                          <strong>Stock:</strong>{" "}
                          {typeof detailProduct.stock !== "undefined"
                            ? detailProduct.stock
                            : "-"}
                        </p>

                        <p>
                          <strong>Descripción:</strong>
                        </p>
                        <p>{detailProduct.descripcion || "-"}</p>
                        <p className="small text-muted">
                          ID: {detailProduct.id}
                        </p>
                      </Col>
                    </Row>
                  ) : (
                    <div>Cargando...</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeDetail}>
                    Cerrar
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
