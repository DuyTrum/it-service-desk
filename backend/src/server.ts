import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app';
import { initSocketServer } from './sockets/socket.server';
import { pool } from './config/db';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    // Verify PostgreSQL connection
    const client = await pool.connect();
    console.log('📦 PostgreSQL Database connection established successfully.');
    client.release();

    const app = createApp();
    const httpServer = http.createServer(app);

    // Initialize Socket.IO Server
    initSocketServer(httpServer);
    console.log('⚡ Socket.IO real-time event server initialized.');

    httpServer.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 IT Helpdesk Backend API running on port ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
