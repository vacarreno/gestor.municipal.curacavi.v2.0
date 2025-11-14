import { useEffect, useState } from "react";
import api from "../api/http";
import { FiletypePdf } from "react-bootstrap-icons";

export default function Reportes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchConductor, setSearchConductor] = useState("");
  const [searchVehiculo, setSearchVehiculo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const perPage = 10;

  // =========================== LOAD + FILTROS ===========================
  const fetchFiltered = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/inspecciones");
      let filtradas = data || [];

      // --- normalizar fechas ---
      const fInicio = fechaInicio ? new Date(fechaInicio + " 00:00:00") : null;
      const fFin = fechaFin ? new Date(fechaFin + " 23:59:59") : null;

      if (searchConductor.trim()) {
        const s = searchConductor.toLowerCase();
        filtradas = filtradas.filter((r) =>
          r.conductor_nombre?.toLowerCase().includes(s)
        );
      }

      if (searchVehiculo.trim()) {
        const s = searchVehiculo.toLowerCase();
        filtradas = filtradas.filter((r) =>
          r.vehiculo_patente?.toLowerCase().includes(s)
        );
      }

      if (fInicio) filtradas = filtradas.filter((r) => new Date(r.fecha) >= fInicio);
      if (fFin) filtradas = filtradas.filter((r) => new Date(r.fecha) <= fFin);

      setTotal(filtradas.length);

      const start = (page - 1) * perPage;
      const end = start + perPage;

      setRows(filtradas.slice(start, end));
    } catch (e) {
      console.error("Error obteniendo inspecciones:", e);
      alert("Error al obtener inspecciones: " + (e?.message || "Error inesperado"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchFiltered, 350);
    return () => clearTimeout(delay);
  }, [page, searchConductor, searchVehiculo, fechaInicio, fechaFin]);

  // =========================== PDF ===========================
  const abrirInforme = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/reportes/inspeccion/${id}/pdf`, {
        responseType: "blob",
      });

      const file = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
    } catch (e) {
      console.error("Error PDF:", e);
      alert("No se pudo abrir el informe PDF.");
    } finally {
      setLoading(false);
    }
  };

  // =========================== CLEAR FILTERS ===========================
  const limpiarFiltros = () => {
    setSearchConductor("");
    setSearchVehiculo("");
    setFechaInicio("");
    setFechaFin("");
    setPage(1);
  };

  // =========================== PAGINACIÓN ===========================
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIdx = (page - 1) * perPage;

  // =========================== MODAL FOTO ===========================
  const [modalFotos, setModalFotos] = useState(null);

  const abrirFotos = (fotoBase64) => {
    if (!fotoBase64) {
      alert("No hay fotografías para esta inspección.");
      return;
    }
    setModalFotos([fotoBase64]);
  };

  return (
    <div className="container-fluid">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="m-0">Reporte de Inspecciones</h3>
        <button
          className="btn btn-outline-secondary"
          onClick={fetchFiltered}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {/* FILTROS */}
      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por Conductor"
              value={searchConductor}
              onChange={(e) => {
                setPage(1);
                setSearchConductor(e.target.value);
              }}
              disabled={loading}
            />
          </div>

          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por Vehículo"
              value={searchVehiculo}
              onChange={(e) => {
                setPage(1);
                setSearchVehiculo(e.target.value);
              }}
              disabled={loading}
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={fechaInicio}
              onChange={(e) => {
                setPage(1);
                setFechaInicio(e.target.value);
              }}
              disabled={loading}
            />
          </div>

          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={fechaFin}
              onChange={(e) => {
                setPage(1);
                setFechaFin(e.target.value);
              }}
              disabled={loading}
            />
          </div>

          <div className="col-md-2 d-grid">
            <button
              className="btn btn-outline-secondary"
              onClick={limpiarFiltros}
              disabled={loading}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>N°</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Fecha</th>
                <th className="text-center">Informe</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 && !loading &&
                rows.map((r, idx) => (
                  <tr key={r.id}>
                    <td>{startIdx + idx + 1}</td>
                    <td>{r.conductor_nombre}</td>
                    <td>{r.vehiculo_patente}</td>
                    <td>{new Date(r.fecha).toLocaleString("es-CL")}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-link text-danger p-0"
                        onClick={() => abrirInforme(r.id)}
                        title="Ver PDF"
                      >
                        <FiletypePdf size={22} />
                      </button>
                    </td>
                  </tr>
                ))}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan="6" className="text-center text-muted p-4">
                    Sin registros disponibles
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="6" className="text-center p-4">
                    <div className="spinner-border text-primary"></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINADOR */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Mostrando {total ? startIdx + 1 : 0}–
          {Math.min(startIdx + perPage, total)} de {total} registros
        </div>

        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Anterior
          </button>

          <button className="btn btn-outline-secondary btn-sm" disabled>
            Página {page} / {totalPages}
          </button>

          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente ›
          </button>
        </div>
      </div>

      {/* MODAL FOTO */}
      {modalFotos && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1050,
          }}
          onClick={() => setModalFotos(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Evidencia fotográfica</h5>
                <button
                  className="btn-close"
                  onClick={() => setModalFotos(null)}
                ></button>
              </div>
              <div className="modal-body d-flex flex-wrap justify-content-center">
                {modalFotos.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`foto-${idx}`}
                    className="rounded border m-1"
                    style={{
                      width: "250px",
                      height: "180px",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
