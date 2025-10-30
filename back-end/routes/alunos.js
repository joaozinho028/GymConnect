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

router.post("/cadastrar-alunos", authMiddleware, cadastrarAlunos);
router.get("/consultar-alunos", authMiddleware, consultarAlunos);
router.get("/estatisticas/:id_filial", authMiddleware, obterEstatisticasAlunos);
router.put("/editar-alunos", authMiddleware, editarAlunos);
router.post("/importar-alunos", authMiddleware, importarAlunos);
router.put("/alterar-status", authMiddleware, alterarStatusAluno);

// Nova rota para validação de CPF e e-mail
// router.post("/validar", authMiddleware, validarAlunoDados);

module.exports = router;
