import { Outlet, useLocation, Navigate } from "react-router-dom";
import NavbarLayout from "./components/NavbarLayout";

export default function App() {
  // ==============================
  // AUTENTICACIÓN
  // ==============================
  const token = sessionStorage.getItem("token");
  const isAuthenticated = Boolean(token && token !== "undefined" && token !== "");

  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  // ==============================
  // RUTAS PROTEGIDAS
  // ==============================
  if (!isAuthenticated && !isLoginPage) {
    sessionStorage.clear();
    return <Navigate to="/login?unauth=1" replace />;
  }

  // ==============================
  // REDIRECCIÓN SI YA ESTÁ LOGEADO
  // ==============================
  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // ==============================
  // UI: LOGIN SIN NAVBAR
  // ==============================
  if (isLoginPage) {
    return (
      <main className="login-container">
        <Outlet />
      </main>
    );
  }

  // ==============================
  // UI: SISTEMA INTERNO CON NAVBAR
  // ==============================
  return <NavbarLayout />;
}
