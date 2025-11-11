import { useEffect, useState } from "react";
import api from "../api/http";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    usuarios: 0,
    vehiculos: 0,
    conductores: 0,
    inspecciones: 0,
  });
  const [vehiculosConInspecciones, setVehiculosConInspecciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // === Cargar datos base ===
        const [usr, veh, cond, insp] = await Promise.all([
          api.get("/usuarios"),
          api.get("/vehiculos"),
          api.get("/usuarios/conductores"),
          api.get("/inspecciones"),
        ]);

        // === Totales ===
        const totalConductores =
          cond?.data?.length ||
          (usr.data || []).filter((u) => u.rol?.toLowerCase?.() === "conductor")
            .length;

        setStats({
          usuarios: usr.data?.length || 0,
          vehiculos: veh.data?.length || 0,
          conductores: totalConductores,
          inspecciones: insp.data?.length || 0,
        });

        // === Combinar vehículos con sus inspecciones ===
        const mapaInspecciones = {};
        insp.data.forEach((i) => {
          const patente =
            i.vehiculo_patente || i.patente || i.vehiculo_id || "Desconocido";
          mapaInspecciones[patente] = (mapaInspecciones[patente] || 0) + 1;
        });

        // === Generar dataset principal ===
        const dataChart = veh.data
          .map((v) => ({
            patente: v.patente || v.placa || "Sin Patente",
            marca: v.marca || "-",
            modelo: v.modelo || "-",
            total_inspecciones: mapaInspecciones[v.patente] || 0,
          }))
          .sort((a, b) => a.patente.localeCompare(b.patente)); // orden alfabético

        setVehiculosConInspecciones(dataChart);
      } catch (e) {
        console.error("❌ Error cargando datos del dashboard:", e);
        alert("Error cargando datos: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  // === Spinner de carga ===
  if (loading)
    return (
      <div
        className="container-fluid d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando datos del dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="container-fluid">
      <h3 className="mb-4">Panel de Control</h3>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="row g-3">
        <div className="col-md-3 col-sm-6">
          <div className="card text-center p-3 shadow-sm border-primary">
            <h6 className="text-muted">Usuarios</h6>
            <h2 className="fw-bold text-primary">{stats.usuarios}</h2>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center p-3 shadow-sm border-success">
            <h6 className="text-muted">Vehículos</h6>
            <h2 className="fw-bold text-success">{stats.vehiculos}</h2>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center p-3 shadow-sm border-info">
            <h6 className="text-muted">Conductores</h6>
            <h2 className="fw-bold text-info">{stats.conductores}</h2>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="card text-center p-3 shadow-sm border-warning">
            <h6 className="text-muted">Inspecciones</h6>
            <h2 className="fw-bold text-warning">{stats.inspecciones}</h2>
          </div>
        </div>
      </div>

      {/* === GRÁFICO VEHÍCULOS + INSPECCIONES === */}
      <div className="card p-3 mt-4 shadow-sm">
        <h5 className="mb-3">🚗 Vehículos con Inspecciones (ordenados por patente)</h5>
        {vehiculosConInspecciones.length ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={vehiculosConInspecciones}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="patente" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value, name) =>
                  name === "total_inspecciones"
                    ? [`${value} inspecciones`, "Total"]
                    : value
                }
              />
              <Legend />
              <Bar dataKey="total_inspecciones" fill="#0d6efd" name="Inspecciones" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted">No hay datos de vehículos.</p>
        )}
      </div>

      {/* RESUMEN */}
      <div className="card p-3 mt-4 shadow-sm">
        <h5 className="mb-3">Resumen general</h5>
        <ul className="list-group list-group-flush small">
          <li className="list-group-item">
            Última sincronización:{" "}
            <strong>{new Date().toLocaleString("es-CL")}</strong>
          </li>
          <li className="list-group-item">
            API activa en:{" "}
            <strong>
              {import.meta.env.VITE_API_URL || "http://localhost:3001"}
            </strong>
          </li>
          <li className="list-group-item">
            Usuario actual:{" "}
            <strong>{user?.username || "No identificado"}</strong> (
            {user?.rol || "sin rol"})
          </li>
        </ul>
      </div>
    </div>
  );
}
