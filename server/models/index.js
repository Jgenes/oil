const User = require('./User');
const Department = require('./Department');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');
const FuelSupplier = require('./FuelSupplier');
const FuelRequest = require('./FuelRequest');
const FuelIssuance = require('./FuelIssuance');
const Trip = require('./Trip');
const MaintenanceRecord = require('./MaintenanceRecord');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');
const OdometerAdjustment = require('./OdometerAdjustment');

module.exports = {
  User,
  Department,
  Vehicle,
  Driver,
  FuelSupplier,
  FuelRequest,
  FuelIssuance,
  Trip,
  MaintenanceRecord,
  AuditLog,
  Notification,
  OdometerAdjustment
};
