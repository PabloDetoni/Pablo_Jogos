// backend/middleware.js
// Middleware de autenticação e autorização para painel admin

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

// Middleware para verificar se o usuário está autenticado
function autenticarToken(req, res, next) {
  const token = req.cookies.token || req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const payload = jwt.verify(token.replace('Bearer ', ''), SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware para garantir que o usuário é admin
function somenteAdmin(req, res, next) {
  if (req.usuario && req.usuario.isadmin) {
    return next();
  }
  return res.status(403).json({ error: 'Acesso restrito a administradores' });
}

module.exports = {
  autenticarToken,
  somenteAdmin
};
