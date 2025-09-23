const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarPerfil,
  editarPerfil,
  consultarPerfis,
  alterarStatusPerfil,
  listarPermissoes,
} = require("../controllers/perfilController");

router.post("/cadastrar-perfil", authMiddleware, cadastrarPerfil);
router.put("/editar-perfil", authMiddleware, editarPerfil);
router.get("/consultar-perfis", authMiddleware, consultarPerfis);
router.put("/alterar-status", authMiddleware, alterarStatusPerfil);
router.get("/listar-permissoes-perfil", authMiddleware, listarPermissoes);

module.exports = router;
