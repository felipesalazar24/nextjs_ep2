"use client";

import { useEffect, useState } from "react";
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
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  useEffect(() => {
    // sólo admins pueden acceder
    if (!user) return; // espera a que se hidrate el contexto
    if (user.rol !== "admin" && !user.isAdmin) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    // carga usuarios desde la API
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al obtener usuarios");
        }
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer."))
      return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar usuario");
      }
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message || "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (u) => {
    setDetailUser(u);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailUser(null);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={12}>
          <Card className="shadow border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Usuarios registrados</h3>
                <div>
                  <Button
                    variant="outline-primary"
                    href="/admin"
                    className="me-2"
                  >
                    Volver al panel
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status" />
                </div>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              {!loading && !error && usuarios.length === 0 && (
                <Alert variant="info">No hay usuarios registrados.</Alert>
              )}

              {!loading && !error && usuarios.length > 0 && (
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Región</th>
                      <th>Comuna</th>
                      <th>Rol</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u, idx) => (
                      <tr key={u.id}>
                        <td>{idx + 1}</td>
                        <td>{u.nombre || "-"}</td>
                        <td>{u.email}</td>
                        <td>{u.telefono || "-"}</td>
                        <td>{u.region || "-"}</td>
                        <td>{u.comuna || "-"}</td>
                        <td>{u.rol || "user"}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => openDetail(u)}
                          >
                            Ver
                          </Button>
                          {/* No permitimos eliminar admins por seguridad en UI */}
                          {u.rol === "admin" ? (
                            <Button variant="secondary" size="sm" disabled>
                              Admin
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                            >
                              {deletingId === u.id ? "Eliminando…" : "Eliminar"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              {/* Modal con detalle completo del usuario (sin password) */}
              <Modal show={showDetail} onHide={closeDetail} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Detalle de usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {detailUser ? (
                    <div>
                      <p>
                        <strong>Nombre:</strong> {detailUser.nombre || "-"}
                      </p>
                      <p>
                        <strong>Email:</strong> {detailUser.email}
                      </p>
                      <p>
                        <strong>Teléfono:</strong> {detailUser.telefono || "-"}
                      </p>
                      <p>
                        <strong>Región:</strong> {detailUser.region || "-"}
                      </p>
                      <p>
                        <strong>Comuna:</strong> {detailUser.comuna || "-"}
                      </p>
                      <p>
                        <strong>Rol:</strong> {detailUser.rol || "user"}
                      </p>
                      <p>
                        <small className="text-muted">
                          ID: {detailUser.id}
                        </small>
                      </p>
                    </div>
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
