const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password), salt);
    const user = await User.create({
      name: name ? String(name).trim() : undefined,
      email: String(email).toLowerCase(),
      passwordHash,
    });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, name: user.name || null },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no registrado' });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, name: user.name || null },
      getJwtSecret(),
      { expiresIn: '7d' }
    );
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;


