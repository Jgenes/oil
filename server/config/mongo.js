const mongoose = require('mongoose');

let isConnected = false;

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[MongoDB] No MONGODB_URI provided in environment. Skipping remote MongoDB connection.');
    return false;
  }

  // Format URI safely for logging (mask password)
  const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
  console.log(`[MongoDB] Attempting connection to: ${maskedUri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000
    });
    isConnected = true;
    console.log('[MongoDB] Successfully connected to MongoDB database!');
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB Atlas (${error.message}).`);
    console.warn('[MongoDB] Note: If running inside a sandboxed environment without external Atlas routing, or if the connection string requires host details, the system operates in fallback mode.');
    return false;
  }
}

function getMongoStatus() {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    readyStateDesc: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
  };
}

module.exports = {
  connectMongo,
  getMongoStatus,
  mongoose
};
