const express = require("express");
const { login, getProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const { register } = require("../controllers/registerController");

const router = express.Router();

// Cadastro
router.post("/register", register);

// Login
router.post("/login", login);

// Perfil do usuário (protegido)
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
