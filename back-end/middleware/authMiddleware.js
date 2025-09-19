const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token ausente" });

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(
      token,
      e4f9b2c7d1a8e6f3b5c0d9a7f1e8b6c3d2f4a1e7c9b0d5a8f2e6c7b9d0a1f3e5
    );
    // decoded: { id_usuario, id_empresa, id_filial, id_perfil, nome_usuario, email_usuario }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

module.exports = authMiddleware;
