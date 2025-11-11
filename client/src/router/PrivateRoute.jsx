import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login?unauth=1" replace />;
  }

  return <Outlet />;
}
