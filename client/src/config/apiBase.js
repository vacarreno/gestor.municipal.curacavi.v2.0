// Detecta si el frontend está corriendo en producción o local
const isProd = window.location.hostname !== "localhost";

// Automático: si es localhost → usa backend local, si es dominio → backend remoto
export const API_BASE_URL = isProd
  ? "https://gestor-municipal-curacavi.onrender.com"          // backend real en hosting
  : "http://localhost:3000";          // backend local

export default API_BASE_URL;
