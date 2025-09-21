const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarAluno,
  consultarAlunos,
  obterEstatisticasAlunos,
} = require("../controllers/alunoController");

router.post("/cadastrar-alunos", authMiddleware, cadastrarAluno);
router.get("/consultar-alunos", authMiddleware, consultarAlunos);
router.get("/estatisticas/:id_filial", authMiddleware, obterEstatisticasAlunos);

module.exports = router;
