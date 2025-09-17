const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  login,
  getProfile,
  alterarSenha,
  uploadAvatar,
  getAvatar,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { register } = require("../controllers/registerController");

const router = express.Router();

// Cadastro
router.post("/register", register);

// Login
router.post("/login", login);

// Perfil do usuário (protegido)
router.get("/profile", authMiddleware, getProfile);

// Alteração de senha (protegido)
router.post("/alterar-senha", authMiddleware, alterarSenha);

// Upload de avatar (protegido)
router.post("/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);

// Buscar avatar por id
router.get("/avatar/:id", getAvatar);

module.exports = router;
