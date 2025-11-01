const express = require("express");
const router = express.Router();
const {
  cadastrarFilial,
  editarFilial,
  ConsultarFiliais,
  listarPerfis,
  listarFiliais,
  listarPlanos,
  criarEmpresa,
} = require("../controllers/empresaController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/cadastrar-filial", authMiddleware, cadastrarFilial);
router.put("/editar-filial", authMiddleware, editarFilial);
router.get("/consultar-filiais", authMiddleware, ConsultarFiliais);
router.get("/listar-perfis", authMiddleware, listarPerfis);
router.get("/listar-filiais", authMiddleware, listarFiliais);
router.get("/listar-planos", authMiddleware, listarPlanos);

router.post('/criar-empresa', criarEmpresa);


module.exports = router;
