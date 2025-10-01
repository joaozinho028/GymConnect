const express = require("express");
const WebhookController = require("../controllers/webhookController");
const router = express.Router();

// Log para debug
console.log("🔗 Rotas de webhook carregadas");

// Webhook da EFí Pay (sem autenticação - vem da EFí Pay)
router.post(
  "/efipay",
  (req, res, next) => {
    console.log("📨 POST /api/webhook/efipay recebida");
    next();
  },
  WebhookController.handleEfiPayWebhook
);

// Endpoint de teste para webhook
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Webhook endpoint funcionando!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
