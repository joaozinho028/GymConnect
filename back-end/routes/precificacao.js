const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarPlano,
  ConsultarPlanos,
  atualizarPlano,
} = require("../controllers/precificacaoController");

// Cadastrar plano
router.post("/cadastrar-planos", authMiddleware, cadastrarPlano);

// Consultar / listar planos
router.get("/consultar-planos", authMiddleware, ConsultarPlanos);

// Atualizar plano (ex.: alterar valor)
router.put("/atualizar-plano", authMiddleware, atualizarPlano);

module.exports = router;
