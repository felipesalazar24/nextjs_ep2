"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
  Dropdown,
  InputGroup,
} from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../../components/Header";

// Lista de categorías: edítala manualmente con las categorías que quieras que aparezcan
const CATEGORIES = [
  "Mouse",
  "Teclado",
  "Audifono",
  "Monitor",
  "Accesorio",
  "Silla",
  "Placa de Video",
];

export default function CrearProductoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: "",
    precio: "",
    imagen: "",
    miniaturasList: [], // lista de rutas separadas por campo
    descripcion: "",
    categoria: "",
    stock: "",
  });

  const [manualTouched, setManualTouched] = useState(false); // si el admin editó manualmente las rutas
  const [uploaded, setUploaded] = useState({
    imagen: null,
    miniaturas: [],
  });

  // Usamos callback ref para poder reaccionar cuando el nodo se monta/actualiza
  const dropNodeRef = useRef(null);
  const setDropNode = useCallback((node) => {
    dropNodeRef.current = node;
  }, []);

  const [dragActive, setDragActive] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [catsOpen, setCatsOpen] = useState(false);

  // Control para mostrar/ocultar panel de rutas manuales
  const [manualOpen, setManualOpen] = useState(false);

  // proteger la ruta: solo admin
  useEffect(() => {
    if (!user) return;
    if (!(user.rol === "admin" || user.isAdmin)) {
      router.push("/login");
    }
  }, [user, router]);

  // Cuando cambian las imágenes subidas, sincronizamos las rutas a menos que el admin haya empezado a editar manualmente
  useEffect(() => {
    if (!uploaded.miniaturas) return;
    setForm((prev) => {
      if (manualTouched) {
        // si el admin ya editó manualmente, añadimos nuevas rutas subidas pero evitando duplicados
        const combined = Array.from(
          new Set([...(prev.miniaturasList || []), ...uploaded.miniaturas])
        );
        return { ...prev, miniaturasList: combined };
      } else {
        // si no ha tocado manual, reemplazamos la lista por las miniaturas subidas
        return { ...prev, miniaturasList: [...uploaded.miniaturas] };
      }
    });
    // Si no hay imagen principal en el form y sí en uploaded, setearla
    setForm((prev) => ({
      ...prev,
      imagen: prev.imagen || uploaded.imagen || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploaded]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setSuccessMsg("");
  };

  const selectCategoria = (cat) => {
    setForm((prev) => ({ ...prev, categoria: cat }));
    if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: "" }));
    setCatsOpen(false);
  };

  // ----- Drag & Drop handlers: attach when dropNodeRef.current changes -----
  useEffect(() => {
    const node = dropNodeRef.current;
    if (!node) return;

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e) => {
      prevent(e);
      setDragActive(true);
    };
    const handleDragOver = (e) => {
      prevent(e);
      setDragActive(true);
    };
    const handleDragLeave = (e) => {
      prevent(e);
      setDragActive(false);
    };
    const handleDrop = (e) => {
      prevent(e);
      setDragActive(false);
      try {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
          const files = Array.from(dt.files);
          uploadFiles(files);
        }
      } catch (err) {
        console.error("Drop handling error", err);
      }
    };

    node.addEventListener("dragenter", handleDragEnter);
    node.addEventListener("dragover", handleDragOver);
    node.addEventListener("dragleave", handleDragLeave);
    node.addEventListener("drop", handleDrop);

    return () => {
      node.removeEventListener("dragenter", handleDragEnter);
      node.removeEventListener("dragover", handleDragOver);
      node.removeEventListener("dragleave", handleDragLeave);
      node.removeEventListener("drop", handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropNodeRef.current]);

  // Convertir File a DataURL (base64)
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject(new Error("Error leyendo archivo"));
      };
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  // Subir multiples archivos: envía JSON { files: [{name, data}, ...] } y recibe { files: [url,...] }
  const uploadFiles = async (files) => {
    try {
      setIsLoading(true);
      const payloadFiles = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        const data = await fileToDataUrl(f);
        payloadFiles.push({ name: f.name, data });
      }
      if (payloadFiles.length === 0) {
        setServerError("No se encontraron imágenes para subir");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payloadFiles }),
      });

      try {
        const json = await res.json();
        if (!res.ok) {
          setServerError(json.error || "Error subiendo imágenes");
          setIsLoading(false);
          return;
        }

        const returned = Array.isArray(json.files) ? json.files : [];
        if (returned.length === 0) {
          setServerError("No se devolvieron rutas de imagen");
          setIsLoading(false);
          return;
        }

        // Actualizar estado uploaded y el form (imagen/miniaturas)
        setUploaded((prev) => {
          // evitar duplicados
          const newMiniSet = new Set([...(prev.miniaturas || []), ...returned]);
          const newMini = Array.from(newMiniSet);
          const newImagen = prev.imagen || returned[0];
          // sincronizar a form en useEffect (que depende de uploaded)
          return { imagen: newImagen, miniaturas: newMini };
        });

        setIsLoading(false);
        setSuccessMsg("Imágenes subidas correctamente");
        setTimeout(() => setSuccessMsg(""), 2000);
      } catch (err) {
        console.error("uploadFiles error", err);
        setServerError(err.message || "Error subiendo archivos");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("uploadFiles outer error", err);
      setServerError(err.message || "Error subiendo archivos");
      setIsLoading(false);
    }
  };

  // Handler para input file (fallback)
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (form.precio === "" || Number.isNaN(Number(form.precio)))
      newErrors.precio = "Precio válido requerido";
    if (!form.categoria || !form.categoria.trim())
      newErrors.categoria = "Selecciona una categoría";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    const miniaturasFinal =
      form.miniaturasList && form.miniaturasList.length
        ? form.miniaturasList.map((s) => s.trim()).filter(Boolean)
        : uploaded.miniaturas.slice();

    const payload = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      imagen: form.imagen.trim() || uploaded.imagen || "",
      miniaturas: miniaturasFinal,
      descripcion: form.descripcion.trim() || "",
      atributo: form.categoria || "",
      extra: { categorias: form.categoria ? [form.categoria] : [] },
      stock: form.stock === "" ? undefined : Number(form.stock),
    };

    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Error al crear el producto");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("Producto creado correctamente");
      setTimeout(() => router.push("/admin/productos"), 900);
    } catch (err) {
      setServerError(err.message || "Error de red");
      setIsLoading(false);
    }
  };

  // borrar imagen en el servidor y actualizar el estado local
  const deleteImageOnServer = async (url) => {
    if (!url) return { ok: false, message: "No url" };
    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: url }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          message: json.error || "Error eliminando en servidor",
        };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Error de red" };
    }
  };

  // eliminar miniatura: borra en servidor y la quita de uploaded y del form.miniaturasList
  const removeMiniatura = async (url) => {
    if (!confirm("¿Eliminar esta imagen también del servidor?")) return;
    setIsLoading(true);
    const res = await deleteImageOnServer(url);
    if (!res.ok) {
      alert(res.message || "No se pudo eliminar la imagen en el servidor");
      setIsLoading(false);
      return;
    }
    setUploaded((prev) => {
      const arr = prev.miniaturas.filter((x) => x !== url);
      setForm((curr) => ({
        ...curr,
        miniaturasList: (curr.miniaturasList || []).filter((x) => x !== url),
      }));
      // si la imagen eliminada era la imagen principal, limpiarla
      let newImagen = prev.imagen;
      if (prev.imagen === url) {
        newImagen = null;
        setForm((curr) => ({ ...curr, imagen: "" }));
      }
      setIsLoading(false);
      return { ...prev, imagen: newImagen, miniaturas: arr };
    });
  };

  const setAsPrincipal = (url) => {
    setUploaded((prev) => {
      setForm((curr) => ({ ...curr, imagen: url }));
      return { ...prev, imagen: url };
    });
  };

  const removePrincipal = async () => {
    const url = uploaded.imagen;
    if (!url) {
      setForm((prev) => ({ ...prev, imagen: "" }));
      setUploaded((prev) => ({ ...prev, imagen: null }));
      return;
    }
    if (!confirm("¿Eliminar la imagen principal también del servidor?")) return;
    setIsLoading(true);
    const res = await deleteImageOnServer(url);
    if (!res.ok) {
      alert(res.message || "No se pudo eliminar la imagen en el servidor");
      setIsLoading(false);
      return;
    }
    setUploaded((prev) => {
      const arr = prev.miniaturas.filter((x) => x !== url);
      setForm((curr) => ({ ...curr, imagen: "", miniaturasList: arr }));
      setIsLoading(false);
      return { imagen: null, miniaturas: arr };
    });
  };

  // editar manualmente una miniatura (marca manualTouched)
  const updateMiniaturaField = (idx, value) => {
    setManualTouched(true);
    setForm((prev) => {
      const copy = [...(prev.miniaturasList || [])];
      copy[idx] = value;
      return { ...prev, miniaturasList: copy };
    });
  };

  // restablecer rutas por defecto (usar las miniaturas subidas como default)
  const restoreDefaults = () => {
    setManualTouched(false);
    setForm((prev) => ({
      ...prev,
      miniaturasList: [...(uploaded.miniaturas || [])],
      imagen: uploaded.imagen || prev.imagen || "",
    }));
  };

  return (
    <>
      {/* Aseguramos que el Header esté presente en esta ruta */}
      <Header />

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">Crear Producto</h4>
                  <Button variant="outline-secondary" href="/admin/productos">
                    Volver a Productos
                  </Button>
                </div>

                {serverError && <Alert variant="danger">{serverError}</Alert>}
                {successMsg && <Alert variant="success">{successMsg}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      isInvalid={!!errors.nombre}
                      placeholder="Nombre del producto"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.nombre}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Precio *</Form.Label>
                    <Form.Control
                      type="number"
                      name="precio"
                      value={form.precio}
                      onChange={handleChange}
                      isInvalid={!!errors.precio}
                      placeholder="Ej: 19999"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.precio}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Selector de categoría */}
                  <Form.Group className="mb-3">
                    <Form.Label>Categoría *</Form.Label>

                    <Dropdown
                      show={catsOpen}
                      onToggle={(isOpen) => setCatsOpen(isOpen)}
                      autoClose="outside"
                    >
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        id="dropdown-categoria"
                        className="d-flex align-items-center justify-content-between"
                      >
                        <div>
                          {form.categoria ? (
                            <span>{form.categoria}</span>
                          ) : (
                            <span className="text-muted">
                              Seleccionar categoría
                            </span>
                          )}
                        </div>
                        <div>
                          {form.categoria ? (
                            <Badge bg="secondary">{form.categoria}</Badge>
                          ) : null}
                        </div>
                      </Dropdown.Toggle>

                      <Dropdown.Menu style={{ minWidth: 220 }}>
                        {CATEGORIES.map((cat) => (
                          <Dropdown.Item
                            as="button"
                            key={cat}
                            onClick={() => selectCategoria(cat)}
                            className="d-flex justify-content-between align-items-center"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <span>{cat}</span>
                            {form.categoria === cat ? (
                              <small className="text-primary">✓</small>
                            ) : null}
                          </Dropdown.Item>
                        ))}

                        <Dropdown.Divider />
                        <div className="px-2 d-flex justify-content-between">
                          <Button
                            size="sm"
                            variant="light"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, categoria: "" }))
                            }
                          >
                            Limpiar
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setCatsOpen(false)}
                          >
                            Listo
                          </Button>
                        </div>
                      </Dropdown.Menu>
                    </Dropdown>

                    <Form.Control.Feedback
                      type="invalid"
                      style={{ display: errors.categoria ? "block" : "none" }}
                    >
                      {errors.categoria}
                    </Form.Control.Feedback>

                    <Form.Text className="text-muted d-block mt-2">
                      Selecciona una única categoría (las categorías disponibles
                      están definidas en la constante CATEGORIES).
                    </Form.Text>
                  </Form.Group>

                  {/* Drag & Drop area */}
                  <Form.Group className="mb-3">
                    <Form.Label>Imágenes (arrastra aquí para subir)</Form.Label>
                    <div
                      ref={setDropNode}
                      style={{
                        border: dragActive
                          ? "2px dashed #0d6efd"
                          : "2px dashed #ddd",
                        padding: 18,
                        borderRadius: 8,
                        textAlign: "center",
                        background: dragActive ? "#f8fbff" : "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const inp = document.getElementById(
                          "file-input-admin-upload"
                        );
                        if (inp) inp.click();
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        {dragActive
                          ? "Suelta las imágenes para subirlas"
                          : "Arrastra tus imágenes aquí o haz clic para seleccionar"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        La primera imagen subida será usada como imagen
                        principal por defecto.
                      </div>
                      <input
                        id="file-input-admin-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileInput}
                      />
                    </div>

                    {/* Previews */}
                    <div className="mt-3 d-flex flex-wrap gap-2">
                      {uploaded.imagen && (
                        <div className="text-center" style={{ width: 96 }}>
                          <div style={{ fontSize: 12, marginBottom: 6 }}>
                            Principal
                          </div>
                          <img
                            src={uploaded.imagen}
                            alt="principal"
                            style={{
                              width: 88,
                              height: 88,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #ddd",
                            }}
                          />
                          <div className="mt-1">
                            <Button
                              size="sm"
                              variant="link"
                              onClick={removePrincipal}
                            >
                              Quitar
                            </Button>
                          </div>
                        </div>
                      )}

                      {uploaded.miniaturas.map((m, i) => (
                        <div
                          key={m}
                          className="text-center"
                          style={{
                            width: 96,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={m}
                            alt={`mini-${i}`}
                            style={{
                              width: 88,
                              height: 88,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #ddd",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              marginTop: 8,
                              width: "100%",
                            }}
                          >
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => setAsPrincipal(m)}
                              className="w-100"
                            >
                              Principal
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => removeMiniatura(m)}
                              className="w-100"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Form.Group>

                  {/* Manual routes button: expand / collapse */}
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0">Rutas manuales</Form.Label>
                      <div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setManualOpen((v) => !v)}
                        >
                          {manualOpen
                            ? "Ocultar rutas"
                            : "Mostrar rutas manuales"}
                        </Button>
                      </div>
                    </div>

                    {manualOpen && (
                      <div
                        style={{
                          border: "1px solid #eee",
                          padding: 12,
                          borderRadius: 6,
                        }}
                      >
                        {/* Imagen principal manual */}
                        <Form.Group className="mb-3">
                          <Form.Label>Imagen principal (ruta)</Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="text"
                              name="imagen"
                              value={form.imagen}
                              onChange={(e) => {
                                handleChange(e);
                                setManualTouched(true);
                              }}
                              placeholder="Ej: /assets/productos/MX.jpg"
                            />
                            <Button
                              variant="light"
                              onClick={() => restoreDefaults()}
                              style={{ marginLeft: 6 }}
                            >
                              reset
                            </Button>
                          </InputGroup>
                          <Form.Text className="text-muted">
                            Se actualizará automáticamente cuando subas por drag
                            &amp; drop.
                          </Form.Text>
                        </Form.Group>

                        {/* Miniaturas como inputs separados (sin botones de Principal/Eliminar junto a cada input) */}
                        <Form.Group className="mb-3">
                          <Form.Label>
                            Miniaturas (cada ruta en su propio campo)
                          </Form.Label>

                          {(form.miniaturasList || []).map((m, idx) => (
                            <InputGroup className="mb-2" key={`mini-${idx}`}>
                              <Form.Control
                                type="text"
                                value={m}
                                onChange={(e) =>
                                  updateMiniaturaField(idx, e.target.value)
                                }
                                placeholder="/assets/productos/MX.1.jpg"
                              />
                            </InputGroup>
                          ))}

                          <Form.Text className="text-muted d-block mt-2">
                            Cada miniatura debe ser una ruta accesible (p. ej.
                            /assets/productos/X.jpg). Usa 'reset' para volver a
                            las rutas generadas automáticamente por la subida.
                          </Form.Text>
                        </Form.Group>
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Descripción</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Descripción breve del producto"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control
                      type="number"
                      name="stock"
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="Cantidad en stock (opcional)"
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creando..." : "Crear Producto"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
