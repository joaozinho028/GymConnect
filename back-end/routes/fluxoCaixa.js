const express = require("express");
const router = express.Router();
const {
  cadastrarCategorias,
  listarCategorias,
  excluirCategoria,
} = require("../controllers/fluxoCaixaController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/cadastrar-categorias", authMiddleware, cadastrarCategorias);
router.get("/listar-categorias", authMiddleware, listarCategorias); // Changed from POST to GET
router.delete("/excluir-categorias/:id", authMiddleware, excluirCategoria); // Added missing route

module.exports = router;
