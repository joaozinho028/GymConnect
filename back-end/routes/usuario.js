const express = require("express");
const router = express.Router();
const { listarUsuarios } = require("../controllers/usuarioController");
const authMiddleware = require("../middleware/authMiddleware");

// Listar usuários da empresa (protegido)
router.get("/listar-usuarios", authMiddleware, listarUsuarios);

module.exports = router;
