const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  cadastrarAluno,
  listarAlunos,
} = require("../controllers/alunoController");

router.post("/cadastrar-alunos", authMiddleware, cadastrarAluno);
router.get("/listar-alunos", authMiddleware, listarAlunos);

module.exports = router;
