import express from "express";
import { auth } from "../middleware/auth.js";
import { getVecinos, updateSaldo, regenerarQR } from "../controllers/billeteraController.js";

const router = express.Router();

// Roles permitidos: admin y adminbilletera
const ROLES = ["admin", "adminbilletera"];

function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    next();
  };
}

// GET vecinos
router.get(
  "/vecinos",
  auth,
  allowRoles(ROLES),
  getVecinos
);

// PUT saldo
router.put(
  "/vecinos/:id/saldo",
  auth,
  allowRoles(ROLES),
  updateSaldo
);

// POST regenerar QR
router.post(
  "/vecinos/:id/qr",
  auth,
  allowRoles(ROLES),
  regenerarQR
);

export default router;
