//server/routes/billeteraRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getVecinos,
  updateSaldo,
  regenerarQR,
} = require("../controllers/billeteraController");

// ✅ Middleware para validar roles permitidos
const ROLES_PERMITIDOS = ["admin", "adminbilletera"];

function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol.toLowerCase())) {
      return res.status(403).json({ message: "No autorizado para esta acción" });
    }
    next();
  };
}

// ✅ RUTAS CON AUTENTICACIÓN Y VALIDACIÓN DE ROL
router.get(
  "/vecinos", 
  auth, 
  allowRoles(ROLES_PERMITIDOS), 
  getVecinos
);

router.put(
  "/vecinos/:id/saldo", 
  auth, 
  allowRoles(ROLES_PERMITIDOS), 
  updateSaldo
);

router.post(
  "/vecinos/:id/qr", 
  auth, 
  allowRoles(ROLES_PERMITIDOS), 
  regenerarQR
);

module.exports = router;