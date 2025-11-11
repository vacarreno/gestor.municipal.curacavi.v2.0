import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Vehiculos from "./pages/Vehiculos.jsx";
import Inspeccion from "./pages/Inspeccion.jsx";
import Reportes from "./pages/Reportes.jsx";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Conductores from "./pages/Conductores.jsx";

import PrivateRoute from "./router/PrivateRoute.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "login", element: <Login /> },
      {
        element: <PrivateRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "vehiculos", element: <Vehiculos /> },
          { path: "conductores", element: <Conductores /> },
          { path: "inspeccion", element: <Inspeccion /> },
          { path: "reportes", element: <Reportes /> },
          { path: "usuarios", element: <Usuarios /> },
        ],
      },
      {
        path: "*",
        element: (
          <div className="alert alert-warning m-3">
            Ruta no encontrada
          </div>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
