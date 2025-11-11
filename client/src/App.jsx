import { Outlet, useLocation, Navigate } from "react-router-dom";
import NavbarLayout from "./components/NavbarLayout";

export default function App() {
  const token = sessionStorage.getItem("token");
  const isAuthenticated = Boolean(token);

  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return isLoginPage ? (
    <main className="login-container">
      <Outlet />
    </main>
  ) : (
    <NavbarLayout />
  );
}

