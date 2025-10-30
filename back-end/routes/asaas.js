const express = require("express");
const router = express.Router();
const { asaasWebhookHandler } = require("../controllers/asaasController");

router.post("/webhook", asaasWebhookHandler);

module.exports = router;