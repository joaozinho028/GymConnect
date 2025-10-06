const express = require("express");
const router = express.Router();
const auditoriaController = require("../controllers/auditoriaController");
const authMiddleware = require("../middleware/authMiddleware");

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de auditoria
router.get("/", auditoriaController.getAll);
router.get("/:id", auditoriaController.getById);
router.get(
  "/entidade/:entidade/:id_entidade",
  auditoriaController.getByEntidade
);

module.exports = router;
