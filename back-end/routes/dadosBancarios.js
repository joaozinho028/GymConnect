const express = require("express");
const router = express.Router();
const {
  buscarDadosBancarios,
  salvarDadosBancarios,
  buscarConfiguracoesTrasferencia,
  salvarConfiguracoesTrasferencia,
} = require("../controllers/dadosBancariosController");
const authMiddleware = require("../middleware/authMiddleware");

// Routes existentes
router.get("/buscar-dados-bancarios", authMiddleware, buscarDadosBancarios);
router.post("/cadastrar-dados-bancarios", authMiddleware, salvarDadosBancarios);

// Novas routes para configurações de transferência
router.get(
  "/transfer-settings",
  authMiddleware,
  buscarConfiguracoesTrasferencia
);
router.post(
  "/configure-transfer",
  authMiddleware,
  salvarConfiguracoesTrasferencia
);

module.exports = router;
