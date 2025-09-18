const express = require("express");
const router = express.Router();
const {
  alterarStatusUsuario,
} = require("../controllers/usuarioEditController");
const authMiddleware = require("../middleware/authMiddleware");

// Listar usuários da empresa (protegido)
router.put("/alterar-status", authMiddleware, alterarStatusUsuario);

module.exports = router;
