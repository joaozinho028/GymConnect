const express = require("express");
const router = express.Router();
const {
  cadastrarFilial,
  editarFilial,
  ConsultarFiliais,
  listarPerfis,
  listarFiliais,
} = require("../controllers/empresaController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/cadastrar-filial", authMiddleware, cadastrarFilial);
router.put("/editar-filial", authMiddleware, editarFilial);
router.get("/consultar-filiais", authMiddleware, ConsultarFiliais);
router.get("/listar-perfis", authMiddleware, listarPerfis);
router.get("/listar-filiais", authMiddleware, listarFiliais);

module.exports = router;
