const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

// Get notifications for current user and role
router.get('/', authenticateToken, (req, res) => {
  const user = req.user;

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR target_role = ? OR target_role = 'all' OR target_role IS NULL
    ORDER BY created_at DESC
    LIMIT 30
  `).all(user.id, user.role);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE is_read = 0 AND (user_id = ? OR target_role = ? OR target_role = 'all' OR target_role IS NULL)
  `).get(user.id, user.role);

  res.json({
    success: true,
    unreadCount: unreadCount.count,
    data: notifications
  });
});

// Mark single notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Notification marked as read' });
});

// Mark all as read
router.post('/mark-all-read', authenticateToken, (req, res) => {
  const user = req.user;
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ? OR target_role = ? OR target_role = 'all' OR target_role IS NULL
  `).run(user.id, user.role);
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
