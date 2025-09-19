const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarPerfil,
  listarPerfis,
  alterarStatusPerfil,
} = require("../controllers/perfilController");

router.post("/cadastrar-perfil", authMiddleware, cadastrarPerfil);
router.get("/listar-perfis", authMiddleware, listarPerfis);
router.put("/alterar-status", authMiddleware, alterarStatusPerfil);

module.exports = router;
