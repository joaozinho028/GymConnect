const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarAluno,
  consultarAlunos,
} = require("../controllers/alunoController");

router.post("/cadastrar-alunos", authMiddleware, cadastrarAluno);
router.get("/consultar-alunos", authMiddleware, consultarAlunos);

module.exports = router;
