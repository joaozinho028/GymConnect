const express = require("express");
const router = express.Router();
const {
  buscarDadosBancarios,
  salvarDadosBancarios,
} = require("../controllers/dadosBancariosController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/buscar-dados-bancarios", authMiddleware, buscarDadosBancarios);
router.post("/cadastrar-dados-bancarios", authMiddleware, salvarDadosBancarios);

module.exports = router;
