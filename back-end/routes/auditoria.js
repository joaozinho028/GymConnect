const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { consultaAuditoria } = require("../controllers/auditoriaController");
const { registrarAuditoria } = require("../controllers/auditoriaController");

router.post("/consulta-auditoria", authMiddleware, consultaAuditoria);
router.post("/registrar-auditoria", authMiddleware, registrarAuditoria);

module.exports = router;
