const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get audit logs (Auditors, Admins, Management)
router.get('/', authenticateToken, requireRole(['internal_auditor', 'admin', 'management']), (req, res) => {
  const { module, action, search, start_date, end_date, limit = 100 } = req.query;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (module) {
    query += ' AND module = ?';
    params.push(module);
  }

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (start_date) {
    query += ' AND date(created_at) >= date(?)';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date(created_at) <= date(?)';
    params.push(end_date);
  }

  if (search) {
    query += ' AND (user_name LIKE ? OR record_id LIKE ? OR reason LIKE ? OR new_values LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(Number(limit));

  const logs = db.prepare(query).all(...params);

  // Distinct modules for filter dropdown
  const modules = db.prepare('SELECT DISTINCT module FROM audit_logs ORDER BY module ASC').all().map(m => m.module);

  res.json({
    success: true,
    modules,
    data: logs
  });
});

module.exports = router;
