const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { JWT_SECRET, authenticateToken, requireRole, logAudit } = require('../middleware/auth');

// Role permissions mapping
const ROLE_PERMISSIONS = {
  admin: ['all'],
  transport_officer: ['vehicles_manage', 'trips_manage', 'fuel_verify', 'fuel_issue', 'maintenance_manage', 'drivers_manage', 'reports_view'],
  driver: ['trips_view_assigned', 'trips_complete', 'vehicles_view'],
  hod: ['fuel_request_create', 'fuel_request_recommend', 'department_view', 'reports_department'],
  approving_officer: ['fuel_request_authorize', 'fuel_request_reject', 'reports_view'],
  finance_officer: ['fuel_finance_record', 'budget_manage', 'expenditure_reports'],
  internal_auditor: ['audit_view', 'reports_view', 'transactions_audit_readonly'],
  management: ['dashboard_executive', 'analytics_view', 'reports_consolidated', 'audit_view']
};

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  const user = db.prepare(`
    SELECT u.*, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.email = ? AND u.is_active = 1
  `).get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, error: 'Invalid university email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAudit({
    user,
    action: 'AUTH_LOGIN',
    module: 'Authentication',
    recordId: user.id,
    reason: 'User logged in successfully',
    ip: req.ip
  });

  const { password: _, ...userData } = user;
  res.json({
    success: true,
    token,
    user: userData,
    permissions: ROLE_PERMISSIONS[user.role] || []
  });
});

// Switch role (impersonation / demo quick switch)
router.post('/switch-role', (req, res) => {
  const { role, email } = req.body;
  let user;

  if (email) {
    user = db.prepare(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.email = ? AND u.is_active = 1
    `).get(email);
  } else if (role) {
    user = db.prepare(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = ? AND u.is_active = 1
      LIMIT 1
    `).get(role);
  }

  if (!user) {
    return res.status(404).json({ success: false, error: 'User for selected role not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password: _, ...userData } = user;
  res.json({
    success: true,
    token,
    user: userData,
    permissions: ROLE_PERMISSIONS[user.role] || []
  });
});

// Current user profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.phone, u.designation, u.signature_title,
           d.name as department_name, d.code as department_code, d.annual_fuel_budget, d.allocated_fuel_budget
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.json({
    success: true,
    user,
    permissions: ROLE_PERMISSIONS[user.role] || []
  });
});

// Get all users
router.get('/users', authenticateToken, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.phone, u.designation, u.signature_title, u.is_active, u.created_at,
           d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY u.id ASC
  `).all();

  res.json({ success: true, data: users });
});

module.exports = router;
