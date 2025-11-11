import { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import api from "../api/http";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    id: null,
    username: "",
    nombre: "",
    correo: "",
    rut: "",
    direccion: "",
    telefono: "",
    licencia: "",
    departamento: "Municipalidad",
    rol: "Usuario",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rutValido, setRutValido] = useState(true);
  const [formKey, setFormKey] = useState(0); // clave para forzar limpieza

  // === FUNCIONES RUT ===
  const cleanRut = (rut) => rut.replace(/[^0-9kK]/g, "").toUpperCase();

  const formatRut = (rut) => {
    rut = cleanRut(rut);
    if (rut.length <= 1) return rut;
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
  };

  const validarRut = (rut) => {
    rut = cleanRut(rut);
    if (rut.length < 8) return false;
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    let suma = 0;
    let multiplicador = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplicador;
      multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }
    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : resto.toString();
    return dvEsperado === dv;
  };

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setForm((s) => ({ ...s, rut: formatted }));
    setRutValido(formatted === "" || validarRut(formatted));
  };

  // === CARGAR USUARIOS ===
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/usuarios");
      setUsuarios(data || []);
    } catch (e) {
      alert("Error cargando usuarios: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // === VALIDAR CAMPOS ÚNICOS ===
  const existeDuplicado = (campo, valor, idActual = null) => {
    if (!valor) return false;
    return usuarios.some(
      (u) =>
        u[campo]?.toLowerCase() === valor.toLowerCase() && u.id !== idActual
    );
  };

  // === RESETEAR FORM ===
  const limpiarFormulario = () => {
    setForm({
      id: null,
      username: "",
      nombre: "",
      correo: "",
      rut: "",
      direccion: "",
      telefono: "",
      licencia: "",
      departamento: "Municipalidad",
      rol: "Usuario",
      password: "",
    });
    setRutValido(true);
  };

  // === GUARDAR O ACTUALIZAR ===
  const handleSubmit = async () => {
    if (!form.username.trim()) return alert("Debe ingresar un usuario");
    if (!form.correo.trim()) return alert("Debe ingresar un correo válido");
    if (form.rut && !validarRut(form.rut))
      return alert("El RUT ingresado no es válido");

    if (existeDuplicado("username", form.username, form.id))
      return alert("El nombre de usuario ya está registrado");
    if (existeDuplicado("correo", form.correo, form.id))
      return alert("El correo ya está registrado");

    try {
      setLoading(true);
      const payload = { ...form, rut: formatRut(form.rut || "") };

      if (form.id) {
        await api.put(`/usuarios/${form.id}`, payload);
        alert("Usuario actualizado correctamente");
      } else {
        if (!form.password)
          return alert("Debe ingresar una contraseña para nuevo usuario");
        await api.post("/usuarios", payload);
        alert("Usuario creado correctamente");
      }

      limpiarFormulario();
      setShowModal(false);
      setFormKey((k) => k + 1); // fuerza limpieza del formulario
      load();
    } catch (e) {
      alert("Error guardando usuario: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // === EDITAR ===
  const editar = (u) => {
    setForm({ ...u, password: "" });
    setShowModal(true);
  };

  // === CAMBIAR PASSWORD ===
  const cambiarPassword = async (id) => {
    const nueva = prompt("Ingrese nueva contraseña:");
    if (!nueva) return;
    try {
      await api.put(`/usuarios/${id}/password`, { password: nueva });
      alert("Contraseña actualizada");
    } catch (e) {
      alert("Error actualizando contraseña: " + e.message);
    }
  };

  // === ELIMINAR ===
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      alert("Usuario eliminado");
      load();
    } catch (e) {
      alert("Error eliminando: " + e.message);
    }
  };

  // === NUEVO USUARIO ===
  const nuevoUsuario = () => {
    limpiarFormulario();
    setFormKey((k) => k + 1); // fuerza render limpio
    setShowModal(true);
  };

  // === CERRAR MODAL ===
  const cerrarModal = () => {
    limpiarFormulario();
    setFormKey((k) => k + 1);
    setShowModal(false);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Gestión de Usuarios</h3>
        <Button variant="primary" onClick={nuevoUsuario}>
          + Nuevo usuario
        </Button>
      </div>

      {/* LISTA */}
      <div className="card p-3">
        <h5>Usuarios registrados</h5>
        <div className="table-responsive">
          <Table hover bordered align="middle">
            <thead className="table-light">
              <tr>
                <th>N°</th>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>RUT</th>
                <th>Teléfono</th>
                <th>Licencia</th>
                <th>Depto.</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, index) => (
                <tr key={u.id}>
                  <td>{index + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.nombre}</td>
                  <td>{u.correo}</td>
                  <td>{u.rut || "-"}</td>
                  <td>{u.telefono || "-"}</td>
                  <td>{u.licencia || "-"}</td>
                  <td>{u.departamento || "-"}</td>
                  <td>{u.rol}</td>
                  <td>{u.activo ? "Sí" : "No"}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      onClick={() => editar(u)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="me-1"
                      onClick={() => cambiarPassword(u.id)}
                    >
                      Clave
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => eliminar(u.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {!usuarios.length && (
                <tr>
                  <td colSpan="11" className="text-center text-muted">
                    Sin usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      <Modal show={showModal} onHide={cerrarModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {form.id ? "Editar usuario" : "Nuevo usuario"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form key={formKey}>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label>Usuario</Form.Label>
                <Form.Control
                  value={form.username}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, username: e.target.value }))
                  }
                  disabled={!!form.id}
                />
              </div>
              <div className="col-md-4">
                <Form.Label>Nombre y Apellido</Form.Label>
                <Form.Control
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, nombre: e.target.value }))
                  }
                />
              </div>
              <div className="col-md-4">
                <Form.Label>Correo</Form.Label>
                <Form.Control
                  type="email"
                  value={form.correo}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, correo: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-4">
                <Form.Label>RUT</Form.Label>
                <Form.Control
                  value={form.rut}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  isInvalid={!rutValido}
                />
                {!rutValido && (
                  <Form.Text className="text-danger">RUT inválido</Form.Text>
                )}
              </div>

              <div className="col-md-4">
                <Form.Label>Dirección</Form.Label>
                <Form.Control
                  value={form.direccion}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, direccion: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-4">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, telefono: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-4">
                <Form.Label>Clase de Licencia</Form.Label>
                <Form.Control
                  value={form.licencia}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, licencia: e.target.value }))
                  }
                  placeholder="Ej: Clase B, A2, etc."
                />
              </div>

              <div className="col-md-4">
                <Form.Label>Departamento</Form.Label>
                <Form.Select
                  value={form.departamento}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, departamento: e.target.value }))
                  }
                >
                  <option value="Municipalidad">Municipalidad</option>
                  <option value="DAEM">DAEM</option>
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label>Rol</Form.Label>
                <Form.Select
                  value={form.rol}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, rol: e.target.value }))
                  }
                >
                  <option value="Usuario">Usuario</option>
                  <option value="Conductor">Conductor</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </Form.Select>
              </div>

              {!form.id && (
                <div className="col-md-4">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, password: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Guardando...
              </>
            ) : form.id ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
