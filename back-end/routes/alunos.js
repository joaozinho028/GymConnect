const express = require("express");
const router = express.Router();
const {
  cadastrarAlunos,
  consultarAlunos,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
  alterarStatusAluno,
  cadastrarAluno,
} = require("../controllers/alunoController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/cadastrar-alunos", authMiddleware, cadastrarAlunos);
router.get("/consultar-alunos", authMiddleware, consultarAlunos);
router.get("/estatisticas/:id_filial", authMiddleware, obterEstatisticasAlunos);
router.put("/editar-alunos", authMiddleware, editarAlunos);
router.post("/importar-alunos", authMiddleware, importarAlunos);
router.put("/alterar-status", authMiddleware, alterarStatusAluno);

module.exports = router;
