const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Token decodificado no middleware:", decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = authMiddleware;
