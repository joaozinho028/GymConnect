const express = require("express");
const router = express.Router();
const {
  getDadosBancarios,
  saveDadosBancarios,
} = require("../controllers/dadosBancariosController");
const authMiddleware = require("../middleware/authMiddleware");

// Buscar dados bancários da empresa
router.get("/buscar-dados-bancarios", authMiddleware, getDadosBancarios);
// Cadastrar/atualizar dados bancários da empresa
router.post("/cadastrar-dados-bancarios", authMiddleware, saveDadosBancarios);

module.exports = router;
