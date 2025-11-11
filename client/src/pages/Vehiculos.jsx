import { useEffect, useState } from "react";
import api from "../api/http";
import {
  PencilSquare,
  Trash,
  PlusCircle,
  ShieldSlashFill, // opción 1: escudo tachado
  BanFill, // opción 2: círculo de prohibido
} from "react-bootstrap-icons";

export default function Vehiculos() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    id: null,
    numero_interno: "",
    patente: "",
    kilometro: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isConductor = user?.rol?.toLowerCase() === "conductor";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vehiculos");
      setRows(data || []);
    } catch (e) {
      alert("Error cargando vehículos: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const abrirModal = (vehiculo = null) => {
    if (isConductor) return;
    if (vehiculo) {
      setForm(vehiculo);
      setIsEditing(true);
    } else {
      setForm({ id: null, numero_interno: "", patente: "", kilometro: "" });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setForm({ id: null, numero_interno: "", patente: "", kilometro: "" });
    setIsEditing(false);
  };

  const guardar = async () => {
    if (isConductor) return;
    const { numero_interno, patente, kilometro, id } = form;
    if (!numero_interno.trim() || !patente.trim()) {
      alert("Debe ingresar número interno y patente");
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/vehiculos/${id}`, {
          numero_interno: numero_interno.trim(),
          patente: patente.trim().toUpperCase(),
          kilometro: Number((kilometro || "").replace(/\D/g, "")) || 0,
        });
        alert("Vehículo actualizado correctamente");
      } else {
        await api.post("/vehiculos", {
          numero_interno: numero_interno.trim(),
          patente: patente.trim().toUpperCase(),
          kilometro: Number((kilometro || "").replace(/\D/g, "")) || 0,
        });
        alert("Vehículo agregado correctamente");
      }
      cerrarModal();
      fetchAll();
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        "Error guardando vehículo. Intente nuevamente.";
      alert(msg);
    }
  };

  const eliminar = async (id) => {
    if (isConductor) return;
    if (!window.confirm("¿Seguro que desea eliminar este vehículo?")) return;

    try {
      await api.delete(`/vehiculos/${id}`);
      alert("Vehículo eliminado correctamente.");
      fetchAll();
    } catch (e) {
      const status = e.response?.status || 0;
      const msg = e.response?.data?.message || "";

      if (status === 400 && msg.includes("asociado a reportes")) {
        alert(
          "⚠️ No se puede eliminar este vehículo porque está siendo utilizado en reportes o inspecciones de conductores."
        );
      } else if (status === 404) {
        alert("Vehículo no encontrado o ya fue eliminado.");
      } else if (status === 500) {
        alert("Error interno del servidor. Intente nuevamente.");
      } else {
        alert("Asociado a un reporte, no se puede eliminar. " + msg);
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Vehículos</h3>
        <div>
          {!isConductor && (
            <button
              className="btn btn-success me-2"
              onClick={() => abrirModal()}
              disabled={loading}
            >
              <PlusCircle className="me-1" /> Nuevo
            </button>
          )}
          <button
            className="btn btn-outline-secondary"
            onClick={fetchAll}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Refrescar"}
          </button>
        </div>
      </div>

      <div className="card p-0">
        <div className="table-responsive">
          <table className="table table-striped mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>N°</th>
                <th>N° interno</th>
                <th>Patente</th>
                <th>KM/HR</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={r.id}>
                  <td>{index + 1}</td>
                  <td>{r.numero_interno}</td>
                  <td>{r.patente}</td>
                  <td>{r.kilometro}</td>
                  <td className="text-center">
                    {isConductor ? (
                      // === OPCIÓN 1: ESCUDO TACHADO ===
                      <ShieldSlashFill
                        size={20}
                        color="red"
                        title="Sin permisos para modificar"
                      />
                      // === OPCIÓN 2: CÍRCULO DE PROHIBIDO ===
                      // <BanFill size={20} color="red" title="Acceso denegado" />
                    ) : (
                      <>
                        <button
                          className="btn btn-link text-primary p-0 me-2"
                          onClick={() => abrirModal(r)}
                          title="Editar"
                        >
                          <PencilSquare size={18} />
                        </button>
                        <button
                          className="btn btn-link text-danger p-0"
                          onClick={() => eliminar(r.id)}
                          title="Eliminar"
                        >
                          <Trash size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan="5" className="text-center text-muted p-4">
                    Sin datos
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isConductor && showModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
          onClick={cerrarModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? "Editar Vehículo" : "Nuevo Vehículo"}
                </h5>
                <button className="btn-close" onClick={cerrarModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">N° interno</label>
                  <input
                    className="form-control"
                    value={form.numero_interno}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, numero_interno: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Patente</label>
                  <input
                    className="form-control text-uppercase"
                    value={form.patente}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, patente: e.target.value }))
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Kilómetro / Horómetro</label>
                  <input
                    className="form-control"
                    value={form.kilometro}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, kilometro: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={guardar}>
                  {isEditing ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
