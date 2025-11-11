import { useEffect, useState } from "react";
import api from "../api/http";
import { Form, Button, Table, Modal, Spinner } from "react-bootstrap";

export default function Inspeccion() {
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [inspecciones, setInspecciones] = useState([]);
  const [form, setForm] = useState({
    vehiculo_id: "",
    usuario_id: "",
    observacion: "",
    estado: "OK",
    items: {},
    foto: null,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // === PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const totalPages = Math.ceil(inspecciones.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentRecords = inspecciones.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // === Usuario logeado ===
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isConductor = user?.rol?.toLowerCase() === "conductor";

 const defaultItems = [
  // 1 - SISTEMA DE LUCES
  "Luces de estacionamiento",
  "Luces bajas",
  "Luces altas",
  "Luz de freno (incluye tercera luz)",
  "Luz de marcha atrás",
  "Luz de viraje derecho",
  "Luz de viraje izquierdo",
  "Luz de emergencia",
  "Luz de patente",
  "Baliza",

  // 2 - SISTEMA DE FRENO
  "Freno de mano",
  "Freno de pedal",
  "Freno otros",

  // 3 - NEUMÁTICOS
  "Neumático delantero derecho",
  "Neumático delantero izquierdo",
  "Neumático trasero derecho",
  "Neumático trasero izquierdo",
  "Neumático de repuesto",
  "Neumáticos otros",

  // 4 - NIVELES / MOTOR
  "Aceite de motor",
  "Agua del radiador",
  "Líquido de freno",
  "Correas",
  "Agua de batería",

  // 5 - ACCESORIOS Y DOCUMENTOS
  "Extintor",
  "Botiquín",
  "Gata",
  "Llave de ruedas",
  "Triángulos",
  "Chaleco reflectante",
  "Limpia parabrisas",
  "Herramientas",
  "Cinturón de seguridad",
  "Espejos laterales",
  "Espejo interior",
  "Radiotransmisor",
  "Bocina de retroceso",
  "Antena",
  "Permiso de circulación",
  "Revisión técnica",
  "Seguro obligatorio",

  // 6 - ESTADO GENERAL Y REMOLQUE
  "Techo",
  "Capot",
  "Puertas",
  "Vidrios",
  "Tapabarros",
  "Pick-up",
  "Parachoques",
  "Tubo de escape",
  "Aseo de cabina",
  "Sanitización COVID-19",
];


  // === Cargar datos ===
  const loadData = async () => {
    setLoading(true);
    try {
      const [vehRes, usrRes, inspRes] = await Promise.all([
        api.get("/vehiculos"),
        api.get("/usuarios"),
        api.get("/inspecciones"),
      ]);

      const conductores = (usrRes.data || []).filter(
        (u) => u.rol?.toLowerCase?.() === "conductor"
      );

      setVehiculos(vehRes.data || []);
      setUsuarios(conductores);
      setInspecciones(inspRes.data || []);

      // Si el usuario es conductor, fijar su ID en el formulario
      if (isConductor && user.id) {
        setForm((f) => ({ ...f, usuario_id: user.id }));
      }
    } catch (e) {
      alert("Error cargando datos: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // === Manejo de foto ===
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  // === Actualizar ítem ===
  const updateItem = (key, field, value) => {
    setForm((f) => ({
      ...f,
      items: {
        ...f.items,
        [key]: { ...(f.items[key] || {}), [field]: value },
      },
    }));
  };

  // === Reset formulario ===
  const resetForm = () => {
    setForm({
      vehiculo_id: "",
      usuario_id: isConductor ? user.id : "",
      observacion: "",
      estado: "OK",
      items: {},
      foto: null,
    });
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  // === Guardar inspección ===
  const handleSave = async () => {
    if (!form.vehiculo_id || !form.usuario_id)
      return alert("Debe seleccionar vehículo y conductor");

    const payload = {
      ...form,
      vehiculo_id: Number(form.vehiculo_id),
      usuario_id: Number(form.usuario_id),
    };

    try {
      await api.post("/inspecciones", payload);
      alert("Inspección registrada correctamente");
      handleClose();
      loadData();
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      alert("Error al registrar inspección: " + msg);
    }
  };

  return (
    <div className="container-fluid px-2 px-sm-3">
      {/* === HEADER === */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3">
        <h3 className="m-0 text-primary fw-semibold mb-2 mb-sm-0">
          Inspecciones
        </h3>
        <Button
          variant="primary"
          size="sm"
          className="shadow-sm"
          onClick={() => setShowModal(true)}
        >
          + Nueva inspección
        </Button>
      </div>

      {/* === TABLA PRINCIPAL === */}
      <div className="card shadow-sm p-2 p-sm-3">
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table
                striped
                hover
                responsive
                bordered
                className="align-middle mb-0"
              >
                <thead className="table-light">
                  <tr>
                    <th className="d-none d-md-table-cell">N°</th>
                    <th>Vehículo</th>
                    <th>Conductor</th>
                    <th>Fecha</th>
                    <th className="d-none d-md-table-cell">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.length ? (
                    currentRecords.map((i, index) => (
                      <tr key={i.id}>
                        <td className="text-center d-none d-md-table-cell">
                          {startIndex + index + 1}
                        </td>
                        <td>{i.vehiculo_patente || "-"}</td>
                        <td>{i.conductor_nombre || "-"}</td>
                        <td className="text-nowrap">
                          {i.fecha
                            ? new Date(i.fecha).toLocaleDateString("es-CL")
                            : "-"}
                        </td>
                        <td className="d-none d-md-table-cell">
                          {i.observacion || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        Sin registros
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* === PAGINACIÓN === */}
            {inspecciones.length > 0 && (
              <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  ◀ Anterior
                </Button>
                <span className="fw-semibold text-secondary">
                  Página {currentPage} de {totalPages || 1}
                </span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Siguiente ▶
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* === MODAL === */}
      <Modal
        show={showModal}
        onHide={handleClose}
        size="lg"
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold text-primary">
            Nueva Inspección
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Vehículo</Form.Label>
                <Form.Select
                  value={form.vehiculo_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehiculo_id: e.target.value }))
                  }
                >
                  <option value="">Seleccione vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} ({v.numero_interno})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Label>Conductor</Form.Label>
                {isConductor ? (
                  <Form.Control
                    type="text"
                    value={user.nombre || user.username || "Conductor"}
                    disabled
                  />
                ) : (
                  <Form.Select
                    value={form.usuario_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, usuario_id: e.target.value }))
                    }
                  >
                    <option value="">Seleccione conductor</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.username})
                      </option>
                    ))}
                  </Form.Select>
                )}
              </div>

              <div className="col-12 mb-3">
                <Form.Label>Observación</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.observacion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observacion: e.target.value }))
                  }
                />
              </div>

              <div className="col-12 mb-3">
                <Form.Label>Foto (opcional)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handlePhoto}
                />
                {form.foto && (
                  <div className="mt-2 text-center">
                    <img
                      src={form.foto}
                      alt="Previsualización"
                      className="img-fluid rounded border"
                      style={{ maxHeight: "180px" }}
                    />
                  </div>
                )}
              </div>
            </div>

            <hr />
            <h5 className="fw-semibold text-secondary mb-3">
              Ítems de Inspección
            </h5>
            <div className="table-responsive">
              <Table bordered size="sm" className="align-middle text-center">
                <thead className="table-light">
                  <tr>
                    <th>Elemento</th>
                    <th>Existe</th>
                    <th>Estado</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultItems.map((key) => (
                    <tr key={key}>
                      <td className="text-start">{key}</td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={form.items[key]?.existe || "SI"}
                          onChange={(e) =>
                            updateItem(key, "existe", e.target.value)
                          }
                        >
                          <option value="SI">Sí</option>
                          <option value="NO">No</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={form.items[key]?.estado || "Bueno"}
                          onChange={(e) =>
                            updateItem(key, "estado", e.target.value)
                          }
                        >
                          <option value="Bueno">Bueno</option>
                          <option value="Regular">Regular</option>
                          <option value="Malo">Malo</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={form.items[key]?.obs || ""}
                          onChange={(e) =>
                            updateItem(key, "obs", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
            className="px-4"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
