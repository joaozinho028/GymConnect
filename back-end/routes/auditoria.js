const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/consulta-auditoria", authMiddleware, consultaAuditoria);

module.exports = router;
