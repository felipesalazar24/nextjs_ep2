"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getProductoById } from "../../../lib/products"; // wrapper

export default function ProductoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id, 10);
  const [producto, setProducto] = useState(null);
  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Normaliza una src para comparación (preserva data: URIs).
  const normalizeSrc = (src) => {
    if (!src) return "";
    const s = String(src).trim();
    if (!s) return "";
    if (s.startsWith("data:")) return s;
    try {
      // new URL(path, origin) convierte rutas relativas en absolutas.
      if (
        typeof window !== "undefined" &&
        window.location &&
        !s.match(/^https?:\/\//i)
      ) {
        return new URL(s, window.location.origin).href;
      }
      return new URL(s).href;
    } catch {
      // fallback: return as-is
      return s;
    }
  };

  // Dev helper: mostrar en consola (borra si no quieres logs)
  const debugLogProducto = (p) => {
    if (!p) return;
    try {
      // muestra imagen y miniaturas y sus formas normalizadas
      // eslint-disable-next-line no-console
      console.log("producto:", {
        imagen: p.imagen,
        miniaturas: p.miniaturas,
        imagen_norm: normalizeSrc(p.imagen),
        mini_norm: (p.miniaturas || []).map(normalizeSrc),
      });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const p = getProductoById(productId);
    setProducto(p);

    if (p) {
      // Selección determinística de la principal:
      // 1) p.imagen si válida, 2) primera miniatura, 3) ""
      const mainCandidate =
        (p.imagen && String(p.imagen).trim()) ||
        (Array.isArray(p.miniaturas) && p.miniaturas.length
          ? p.miniaturas[0]
          : "") ||
        "";
      setImagenPrincipal(mainCandidate);
      debugLogProducto(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Si el producto cambia, reajustar imagenPrincipal si es inválida
  useEffect(() => {
    if (!producto) return;
    const mainCandidate =
      (producto.imagen && String(producto.imagen).trim()) ||
      (Array.isArray(producto.miniaturas) && producto.miniaturas.length
        ? producto.miniaturas[0]
        : "") ||
      "";
    const currentNorm = normalizeSrc(imagenPrincipal);
    const availableNorms = [
      normalizeSrc(producto.imagen),
      ...(Array.isArray(producto.miniaturas)
        ? producto.miniaturas.map(normalizeSrc)
        : []),
    ];
    if (!imagenPrincipal || !availableNorms.includes(currentNorm)) {
      setImagenPrincipal(mainCandidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto]);

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

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    addToCart({ ...producto }, Number(cantidad));
    alert(`¡${producto.nombre} agregado al carrito!`);
  };

  // safeSrc: devuelve ruta usable para <img> (preserva data: URIs)
  const safeSrc = (src) => {
    if (!src) return "/assets/productos/placeholder.png";
    try {
      const s = String(src);
      if (s.startsWith("data:")) return s;
      if (typeof window !== "undefined" && !s.match(/^https?:\/\//i)) {
        return new URL(s, window.location.origin).href;
      }
      return s;
    } catch {
      return String(src);
    }
  };

  // Construye thumbs: incluye imagen principal primero, luego miniaturas; deduplica
  const buildThumbs = () => {
    const seen = new Set();
    const thumbs = [];
    const pushIfNew = (orig) => {
      if (!orig) return;
      const norm = normalizeSrc(orig);
      if (!norm) return;
      if (!seen.has(norm)) {
        seen.add(norm);
        thumbs.push(orig);
      }
    };

    // push principal (producto.imagen) primero si existe
    pushIfNew(producto.imagen);

    // luego las miniaturas en orden
    if (Array.isArray(producto.miniaturas)) {
      for (const m of producto.miniaturas) pushIfNew(m);
    }
    return thumbs;
  };

  const thumbs = buildThumbs();
  const imagenPrincipalNorm = normalizeSrc(imagenPrincipal);

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/productos">Productos</Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={6}>
          <Card className="p-3">
            <div
              style={{
                width: "100%",
                minHeight: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
              }}
            >
              <img
                src={safeSrc(imagenPrincipal)}
                alt={producto.nombre}
                style={{ width: "100%", objectFit: "contain", maxHeight: 520 }}
              />
            </div>

            <div className="d-flex gap-2 mt-2 flex-wrap">
              {thumbs.length > 0 ? (
                thumbs.map((m, i) => {
                  const isActive = normalizeSrc(m) === imagenPrincipalNorm;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImagenPrincipal(m)}
                      style={{
                        border: isActive
                          ? "2px solid #0d6efd"
                          : "1px solid #ddd",
                        padding: 4,
                        borderRadius: 6,
                        background: "#fff",
                        cursor: "pointer",
                        width: 64,
                        height: 64,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-pressed={isActive}
                      title={`Ver imagen ${i + 1}`}
                    >
                      <img
                        src={safeSrc(m)}
                        alt={`${producto.nombre}-${i}`}
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          display: "block",
                          borderRadius: 4,
                        }}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="text-muted small">No hay miniaturas</div>
              )}
            </div>
          </Card>
        </Col>

        <Col md={6}>
          <h2>{producto.nombre}</h2>
          <Badge bg="secondary" className="mb-2">
            {producto.atributo}
          </Badge>
          <h3 className="text-primary">
            ${Number(producto.precio).toLocaleString("es-CL")}
          </h3>
          <p>{producto.descripcion}</p>

          <div className="d-flex align-items-center gap-2 mb-3">
            <Form.Control
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              style={{ width: 100 }}
            />
            <Button variant="primary" onClick={handleAddToCart}>
              Agregar al Carrito
            </Button>
            <Link href="/carrito" className="btn btn-outline-secondary">
              Ver Carrito
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
