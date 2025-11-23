// ===============================
// billeteraRoutes.js (CommonJS)
// ===============================

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getVecinos,
  updateSaldo,
  regenerarQR,
} = require("../controllers/billeteraController");

// Roles permitidos
const ROLES = ["admin", "adminbilletera"];

// Middleware de roles
function allowRoles(roles) {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.rol)) {
        return res.status(403).json({ message: "No autorizado" });
      }
      next();
    } catch (err) {
      console.error("Error allowRoles:", err);
      res.status(500).json({ error: "Error interno" });
    }
  };
}

// ===============================
//          RUTAS
// ===============================

// GET vecinos
router.get("/vecinos", auth, allowRoles(ROLES), getVecinos);

// PUT saldo
router.put("/vecinos/:id/saldo", auth, allowRoles(ROLES), updateSaldo);

// POST regenerar QR
router.post("/vecinos/:id/qr", auth, allowRoles(ROLES), regenerarQR);

module.exports = router;
