const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation for submitting a quotation
const quotationValidation = [
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('delivery_time')
    .trim()
    .notEmpty()
    .withMessage('Estimated delivery time is required'),
  body('message')
    .optional()
    .trim(),
];

/**
 * POST /api/rfqs/:rfqId/quotations
 * Submit a quotation for an RFQ (Supplier only)
 */
router.post(
  '/rfqs/:rfqId/quotations',
  authenticate,
  authorize('supplier'),
  quotationValidation,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rfqId } = req.params;
    const { price, delivery_time, message } = req.body;

    // Check RFQ exists and is open
    const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(rfqId);
    if (!rfq) {
      return res.status(404).json({ error: 'RFQ not found.' });
    }

    if (rfq.status !== 'open') {
      return res.status(400).json({ error: 'This RFQ is no longer accepting quotations.' });
    }

    if (new Date(rfq.deadline) < new Date()) {
      return res.status(400).json({ error: 'The deadline for this RFQ has passed.' });
    }

    // Check if supplier already submitted a quotation
    const existing = db.prepare(
      'SELECT id FROM quotations WHERE rfq_id = ? AND supplier_id = ?'
    ).get(rfqId, req.user.id);

    if (existing) {
      // Update existing quotation
      db.prepare(`
        UPDATE quotations 
        SET price = ?, delivery_time = ?, message = ?, created_at = CURRENT_TIMESTAMP
        WHERE rfq_id = ? AND supplier_id = ?
      `).run(price, delivery_time, message || '', rfqId, req.user.id);

      const updated = db.prepare('SELECT * FROM quotations WHERE rfq_id = ? AND supplier_id = ?')
        .get(rfqId, req.user.id);

      return res.json({ message: 'Quotation updated successfully', quotation: updated });
    }

    // Insert new quotation
    const stmt = db.prepare(`
      INSERT INTO quotations (rfq_id, supplier_id, price, delivery_time, message)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(rfqId, req.user.id, price, delivery_time, message || '');

    const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Quotation submitted successfully', quotation });
  }
);

/**
 * GET /api/rfqs/:rfqId/quotations
 * View quotations for an RFQ (Buyer owner only)
 */
router.get('/rfqs/:rfqId/quotations', authenticate, authorize('buyer'), (req, res) => {
  const { rfqId } = req.params;

  // Verify RFQ ownership
  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(rfqId);
  if (!rfq) {
    return res.status(404).json({ error: 'RFQ not found.' });
  }

  if (rfq.buyer_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only view quotations for your own RFQs.' });
  }

  const quotations = db.prepare(`
    SELECT quotations.*, users.name as supplier_name, users.company as supplier_company, users.email as supplier_email
    FROM quotations
    JOIN users ON users.id = quotations.supplier_id
    WHERE quotations.rfq_id = ?
    ORDER BY quotations.created_at DESC
  `).all(rfqId);

  res.json({ quotations });
});

/**
 * GET /api/quotations/my
 * View all quotations submitted by the current supplier
 */
router.get('/quotations/my', authenticate, authorize('supplier'), (req, res) => {
  const quotations = db.prepare(`
    SELECT quotations.*, 
      rfqs.title as rfq_title, rfqs.status as rfq_status, rfqs.deadline as rfq_deadline,
      rfqs.quantity as rfq_quantity, rfqs.delivery_location as rfq_delivery_location,
      users.name as buyer_name, users.company as buyer_company
    FROM quotations
    JOIN rfqs ON rfqs.id = quotations.rfq_id
    JOIN users ON users.id = rfqs.buyer_id
    WHERE quotations.supplier_id = ?
    ORDER BY quotations.created_at DESC
  `).all(req.user.id);

  res.json({ quotations });
});

module.exports = router;
