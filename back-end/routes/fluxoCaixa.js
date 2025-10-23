const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/fluxoCaixaController");

// Categorias
router.post("/categorias", auth, controller.cadastrarCategorias);
router.get("/categorias", auth, controller.listarCategorias);
router.delete("/categorias/:id", auth, controller.excluirCategoria);

// Transações
router.get("/", auth, controller.listarTransacoes);
router.post("/", auth, controller.criarTransacao);
router.put("/:id", auth, controller.editarTransacao);
router.delete("/:id", auth, controller.excluirTransacao);

module.exports = router;
