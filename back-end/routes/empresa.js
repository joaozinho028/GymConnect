const express = require("express");
const router = express.Router();
const {
  listarPerfis,
  listarFiliais,
} = require("../controllers/empresaController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/listar-perfis", authMiddleware, listarPerfis);
router.get("/listar-filiais", authMiddleware, listarFiliais);

module.exports = router;
