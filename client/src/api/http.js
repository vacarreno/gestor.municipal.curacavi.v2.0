import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL +  "/";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// Inyectar token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Logout global
let redirecting = false;
const autoLogout = () => {
  if (redirecting) return;
  redirecting = true;
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  window.location.href = "/login?expired=1";
};

// Manejo de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) autoLogout();
    if (!err.response) return Promise.reject("Servidor no disponible");

    const msg =
      err.response.data?.message ||
      err.response.data?.error ||
      `Error ${status}`;

    return Promise.reject(msg);
  }
);

export default api;
