const express = require("express");
const router = express.Router();
const { listarUsuarios } = require("../controllers/usuarioController");
const { alterarStatusUsuario } = require("../controllers/usuarioController");
const { cadastrarUsuario } = require("../controllers/usuarioController");
const authMiddleware = require("../middleware/authMiddleware");

//Cadastrar usuario
router.post("/cadastrar-usuario", authMiddleware, cadastrarUsuario);
// Listar usuários da empresa (protegido)
router.get("/listar-usuarios", authMiddleware, listarUsuarios);

//Alterar status do usuario
router.put("/alterar-status", authMiddleware, alterarStatusUsuario);

module.exports = router;
