require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { db } = require('./db/database');
const { seedDatabase } = require('./db/seed');
const { connectMongo, getMongoStatus } = require('./config/mongo');

// Attempt MongoDB connection if configured
connectMongo().catch(err => {
  console.log('[MongoDB] Connection attempt finished:', err.message);
});

// Seed database on startup if empty
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  seedDatabase();
}

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const vehicleRoutes = require('./routes/vehicles');
const fuelRequestRoutes = require('./routes/fuelRequests');
const fuelIssuanceRoutes = require('./routes/fuelIssuances');
const tripRoutes = require('./routes/trips');
const fuelConsumptionRoutes = require('./routes/fuelConsumption');
const driverRoutes = require('./routes/drivers');
const departmentRoutes = require('./routes/departments');
const supplierRoutes = require('./routes/suppliers');
const maintenanceRoutes = require('./routes/maintenance');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for document uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/fuel-requests', fuelRequestRoutes);
app.use('/api/fuel-issuances', fuelIssuanceRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/fuel-consumption', fuelConsumptionRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// System reset / demo seeder endpoint
app.post('/api/system/reset-demo', (req, res) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'MoCU Fleet Management System successfully re-seeded with demo data' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    university: 'Moshi Co-operative University (MoCU)',
    system: 'Fleet Fuel and Vehicle Management System',
    timestamp: new Date().toISOString()
  });
});

// Database status check
app.get('/api/database-status', (req, res) => {
  const mongoStatus = getMongoStatus();
  const rawUri = process.env.MONGODB_URI || '';
  const maskedUri = rawUri ? rawUri.replace(/:([^:@]+)@/, ':****@') : 'Not configured';

  res.json({
    active_database: mongoStatus.isConnected ? 'MongoDB Atlas' : 'Embedded SQLite (Sandbox Fallback Mode)',
    mongodb: {
      configured: Boolean(process.env.MONGODB_URI),
      uri: maskedUri,
      username: process.env.MONGODB_USERNAME || null,
      status: mongoStatus.readyStateDesc,
      connected: mongoStatus.isConnected,
      models_ready: ['User', 'Department', 'Vehicle', 'Driver', 'FuelSupplier', 'FuelRequest', 'FuelIssuance', 'Trip', 'MaintenanceRecord', 'AuditLog', 'Notification', 'OdometerAdjustment']
    },
    message: mongoStatus.isConnected
      ? 'Successfully connected to MongoDB database.'
      : 'Using local database engine in current environment. Remote MongoDB schemas and seeder (npm run seed:mongo) are ready for deployment.'
  });
});

// Serve frontend static files
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// For SPA routing, any non-API route returns index.html
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'MoCU Fleet Management API is running. Client build in progress...',
      docs: '/api/health'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`MoCU Fleet Fuel and Vehicle Management System`);
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`=======================================================`);
});
