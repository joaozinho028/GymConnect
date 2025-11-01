const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarUsuario,
  editarUsuario,
  listarUsuarios,
  alterarStatusUsuario,
  cadastrarUsuarioPublico,
} = require("../controllers/usuarioController");
// Cadastro inicial: criar usuário sem autenticação
router.post("/cadastrar-usuario-publico", cadastrarUsuarioPublico);

router.post("/cadastrar-usuario", authMiddleware, cadastrarUsuario);
router.put("/editar-usuario", authMiddleware, editarUsuario);
router.get("/listar-usuarios", authMiddleware, listarUsuarios);
router.put("/alterar-status", authMiddleware, alterarStatusUsuario);

module.exports = router;
