const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarPerfil,
  consultarPerfis,
  alterarStatusPerfil,
} = require("../controllers/perfilController");

router.post("/cadastrar-perfil", authMiddleware, cadastrarPerfil);
router.get("/consultar-perfis", authMiddleware, consultarPerfis);
router.put("/alterar-status", authMiddleware, alterarStatusPerfil);

module.exports = router;
