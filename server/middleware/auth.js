const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'mocu-fleet-secure-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided, check if an x-user-id or x-role header was passed for role preview testing
    const fallbackUserId = req.headers['x-user-id'];
    if (fallbackUserId) {
      const user = db.prepare('SELECT id, name, email, role, department_id, designation, signature_title FROM users WHERE id = ? AND is_active = 1').get(fallbackUserId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ success: false, error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired authentication token' });
    }
    const user = db.prepare('SELECT id, name, email, role, department_id, designation, signature_title FROM users WHERE id = ? AND is_active = 1').get(decoded.id);
    if (!user) {
      return res.status(403).json({ success: false, error: 'User account not found or deactivated' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Current role: ${req.user.role}`
    });
  };
}

function logAudit({ user, action, module, recordId, oldValues = null, newValues = null, reason = null, ip = null }) {
  try {
    const insert = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, module, record_id, old_values, new_values, reason, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      user ? user.id : null,
      user ? user.name : 'System',
      user ? user.role : 'system',
      action,
      module,
      recordId ? String(recordId) : null,
      oldValues ? (typeof oldValues === 'object' ? JSON.stringify(oldValues) : String(oldValues)) : null,
      newValues ? (typeof newValues === 'object' ? JSON.stringify(newValues) : String(newValues)) : null,
      reason,
      ip || '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

function createNotification({ userId = null, targetRole = null, title, message, type = 'info', link = null }) {
  try {
    const insert = db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, type, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run(userId, targetRole, title, message, type, link);
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  logAudit,
  createNotification
};
