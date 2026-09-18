const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation for creating/updating RFQ
const rfqValidation = [
  body('title').trim().notEmpty().withMessage('Product/service name is required'),
  body('description').trim().notEmpty().withMessage('Requirement description is required'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('delivery_location').trim().notEmpty().withMessage('Delivery location is required'),
  body('deadline')
    .isISO8601()
    .withMessage('Valid deadline date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be a future date');
      }
      return true;
    }),
];

/**
 * POST /api/rfqs
 * Create a new RFQ (Buyer only)
 */
router.post('/', authenticate, authorize('buyer'), rfqValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, quantity, delivery_location, deadline } = req.body;

  const stmt = db.prepare(`
    INSERT INTO rfqs (buyer_id, title, description, quantity, delivery_location, deadline)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(req.user.id, title, description, quantity, delivery_location, deadline);

  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ message: 'RFQ created successfully', rfq });
});

/**
 * GET /api/rfqs
 * List RFQs
 * - Buyers see their own RFQs
 * - Suppliers see all open RFQs (with search/filter)
 */
router.get('/', authenticate, (req, res) => {
  const { search, status, sort } = req.query;

  if (req.user.role === 'buyer') {
    // Buyers see their own RFQs
    let sql = `
      SELECT rfqs.*, 
        (SELECT COUNT(*) FROM quotations WHERE quotations.rfq_id = rfqs.id) as quotation_count
      FROM rfqs 
      WHERE buyer_id = ?
    `;
    const params = [req.user.id];

    if (status && ['open', 'closed'].includes(status)) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += sort === 'oldest' ? ' ORDER BY created_at ASC' : ' ORDER BY created_at DESC';

    const rfqs = db.prepare(sql).all(...params);
    return res.json({ rfqs });
  }

  // Suppliers see all open RFQs
  let sql = `
    SELECT rfqs.*, users.name as buyer_name, users.company as buyer_company,
      (SELECT COUNT(*) FROM quotations WHERE quotations.rfq_id = rfqs.id) as quotation_count
    FROM rfqs
    JOIN users ON users.id = rfqs.buyer_id
    WHERE rfqs.status = 'open' AND rfqs.deadline >= date('now')
  `;
  const params = [];

  if (search) {
    sql += ' AND (rfqs.title LIKE ? OR rfqs.description LIKE ? OR rfqs.delivery_location LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += sort === 'deadline' ? ' ORDER BY rfqs.deadline ASC' : ' ORDER BY rfqs.created_at DESC';

  const rfqs = db.prepare(sql).all(...params);
  res.json({ rfqs });
});

/**
 * GET /api/rfqs/:id
 * Get full RFQ details
 */
router.get('/:id', authenticate, (req, res) => {
  const rfq = db.prepare(`
    SELECT rfqs.*, users.name as buyer_name, users.company as buyer_company
    FROM rfqs
    JOIN users ON users.id = rfqs.buyer_id
    WHERE rfqs.id = ?
  `).get(req.params.id);

  if (!rfq) {
    return res.status(404).json({ error: 'RFQ not found.' });
  }

  // Suppliers can only see open RFQs
  if (req.user.role === 'supplier' && rfq.status !== 'open') {
    return res.status(403).json({ error: 'This RFQ is no longer available.' });
  }

  // Add quotation count
  const countResult = db.prepare('SELECT COUNT(*) as count FROM quotations WHERE rfq_id = ?').get(rfq.id);
  rfq.quotation_count = countResult.count;

  // If supplier, check if they already submitted a quotation
  if (req.user.role === 'supplier') {
    const existingQuote = db.prepare(
      'SELECT * FROM quotations WHERE rfq_id = ? AND supplier_id = ?'
    ).get(rfq.id, req.user.id);
    rfq.my_quotation = existingQuote || null;
  }

  res.json({ rfq });
});

/**
 * PUT /api/rfqs/:id
 * Update an RFQ (Buyer owner only, only if still open)
 */
router.put('/:id', authenticate, authorize('buyer'), rfqValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(req.params.id);

  if (!rfq) {
    return res.status(404).json({ error: 'RFQ not found.' });
  }

  if (rfq.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own RFQs.' });
  }

  if (rfq.status === 'closed') {
    return res.status(400).json({ error: 'Cannot edit a closed RFQ.' });
  }

  const { title, description, quantity, delivery_location, deadline } = req.body;

  db.prepare(`
    UPDATE rfqs 
    SET title = ?, description = ?, quantity = ?, delivery_location = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, quantity, delivery_location, deadline, req.params.id);

  const updated = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(req.params.id);
  res.json({ message: 'RFQ updated successfully', rfq: updated });
});

/**
 * DELETE /api/rfqs/:id
 * Delete an RFQ (Buyer owner only)
 */
router.delete('/:id', authenticate, authorize('buyer'), (req, res) => {
  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(req.params.id);

  if (!rfq) {
    return res.status(404).json({ error: 'RFQ not found.' });
  }

  if (rfq.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own RFQs.' });
  }

  db.prepare('DELETE FROM rfqs WHERE id = ?').run(req.params.id);
  res.json({ message: 'RFQ deleted successfully.' });
});

/**
 * PATCH /api/rfqs/:id/close
 * Close an RFQ (Buyer owner only)
 */
router.patch('/:id/close', authenticate, authorize('buyer'), (req, res) => {
  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(req.params.id);

  if (!rfq) {
    return res.status(404).json({ error: 'RFQ not found.' });
  }

  if (rfq.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only close your own RFQs.' });
  }

  db.prepare("UPDATE rfqs SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ message: 'RFQ closed successfully.' });
});

module.exports = router;
