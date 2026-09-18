const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation helpers
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['buyer', 'supplier'])
    .withMessage('Role must be buyer or supplier'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, company } = req.body;

  // Check if user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Insert user
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password, role, company) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, email, hashedPassword, role, company);

  // Generate JWT
  const token = jwt.sign(
    { id: result.lastInsertRowid, email, role, name, company },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: result.lastInsertRowid,
      name,
      email,
      role,
      company,
    },
  });
});

/**
 * POST /api/auth/login
 * Login and receive JWT
 */
router.post('/login', loginValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Compare password
  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, company: user.company },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    },
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, company, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

module.exports = router;
