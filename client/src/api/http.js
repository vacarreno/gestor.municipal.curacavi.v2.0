import axios from "axios";

// ===============================
// CONFIG AXIOS
// ===============================
const api = axios.create({
  baseURL: "https://curacavi-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// INYECTAR TOKEN AUTOMÁTICAMENTE
// ===============================
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===============================
// LOGOUT GLOBAL (TOKEN EXPIRADO)
// ===============================
let redirecting = false;
const autoLogout = () => {
  if (redirecting) return;
  redirecting = true;

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  window.location.href = "/login?expired=1";
};

// ===============================
// MANEJO DE ERRORES
// ===============================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    // Token inválido o expirado
    if (status === 401) autoLogout();

    // Backend no responde
    if (!err.response) return Promise.reject("Servidor no disponible");

    // Mensaje corporativo unificado
    const msg =
      err.response.data?.message ||
      err.response.data?.error ||
      `Error ${status}`;

    return Promise.reject(msg);
  }
);

// ===============================
// EXPORT
// ===============================
export default api;
