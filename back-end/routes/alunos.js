const express = require("express");
const router = express.Router();
const {
  iniciarCadastroAluno,
  consultarAlunos,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
  alterarStatusAluno,
} = require("../controllers/alunoController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/iniciar-cadastro-aluno", authMiddleware, iniciarCadastroAluno);

// Routes existentes
router.get("/consultar-alunos", authMiddleware, consultarAlunos);
router.get("/estatisticas/:id_filial", authMiddleware, obterEstatisticasAlunos);
router.put("/editar-alunos", authMiddleware, editarAlunos);
router.post("/importar-alunos", authMiddleware, importarAlunos);
router.put("/alterar-status", authMiddleware, alterarStatusAluno);

module.exports = router;
