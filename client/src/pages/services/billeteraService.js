import axios from "axios";

const API = "https://curacavi-backend.onrender.com";

// ✅ Función para obtener el token del localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ✅ Obtener vecinos con autenticación
export const getVecinos = () =>
  axios.get(`${API}/billetera/vecinos`, getAuthHeaders());

// ✅ Actualizar saldo con autenticación
export const updateSaldo = (id, monto) =>
  axios.put(
    `${API}/billetera/vecinos/${id}/saldo`,
    { monto },
    getAuthHeaders()
  );

// ✅ Regenerar QR con autenticación
export const regenerarQR = (id) =>
  axios.post(`${API}/billetera/vecinos/${id}/qr`, {}, getAuthHeaders());
