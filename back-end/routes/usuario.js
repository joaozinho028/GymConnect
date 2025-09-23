const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarUsuario,
  editarUsuario,
  listarUsuarios,
  alterarStatusUsuario,
} = require("../controllers/usuarioController");

router.post("/cadastrar-usuario", authMiddleware, cadastrarUsuario);
router.put("/editar-usuario", authMiddleware, editarUsuario);
router.get("/listar-usuarios", authMiddleware, listarUsuarios);
router.put("/alterar-status", authMiddleware, alterarStatusUsuario);

module.exports = router;
