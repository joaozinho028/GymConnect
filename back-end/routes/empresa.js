const express = require("express");
const router = express.Router();
const {
  listarPerfis,
  listarFiliais,
} = require("../controllers/empresaController");
const authMiddleware = require("../middleware/authMiddleware");

// Listar perfis da empresa do usuário logado
router.get("/listar-perfis", authMiddleware, listarPerfis);

// Listar filiais da empresa do usuário logado
router.get("/listar-filiais", authMiddleware, listarFiliais);

module.exports = router;
