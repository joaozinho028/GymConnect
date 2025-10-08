const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarAluno,
  consultarAlunos,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
} = require("../controllers/alunoController");
const {
  validarImportacaoAlunos,
} = require("../middleware/importacaoMiddleware");

router.post("/cadastrar-alunos", authMiddleware, cadastrarAluno);
router.get("/consultar-alunos", authMiddleware, consultarAlunos);
router.get("/estatisticas/:id_filial", authMiddleware, obterEstatisticasAlunos);
router.put("/editar-alunos", authMiddleware, editarAlunos);
// Rota para importar alunos em lote
router.post(
  "/importar-alunos",
  authMiddleware,
  validarImportacaoAlunos,
  importarAlunos
);

module.exports = router;
