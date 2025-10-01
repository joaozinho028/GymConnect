const express = require("express");
const PaymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Middleware de autenticação
router.use(authMiddleware);

// Criar cobrança e enviar via WhatsApp
router.post("/criar-cobranca", PaymentController.createStudentCharge);

module.exports = router;
