const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/fluxoCaixaController");

// Categorias
router.post(
  "/cadastrar-categorias",
  authMiddleware,
  controller.cadastrarCategorias
);
router.get("/listar-categorias", authMiddleware, controller.listarCategorias);
router.delete(
  "/excluir-categorias/:id",
  authMiddleware,
  controller.excluirCategoria
);

// Transações
router.get("/listar-transacoes", authMiddleware, controller.listarTransacoes);
router.post("/cadastrar-transacao", authMiddleware, controller.criarTransacao);
router.put("/editar-transacao/:id", authMiddleware, controller.editarTransacao);
router.delete(
  "/excluir-transacao/:id",
  authMiddleware,
  controller.excluirTransacao
);

module.exports = router;
