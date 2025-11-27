const jwt = require('jsonwebtoken');
const config = require('../config');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'please-change-this-secret';
  return secret;
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { id: payload.sub, email: payload.email, name: payload.name || null };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { authMiddleware, getJwtSecret };


