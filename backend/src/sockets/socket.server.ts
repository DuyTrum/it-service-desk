import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

let ioInstance: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = verifyToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`⚡ Socket connected: User ${user.email} (${user.role}) [ID: ${socket.id}]`);

    // Join personal user room
    socket.join(`user:${user.id}`);

    // Join role channels
    if (user.role === 'TECHNICIAN' || user.role === 'ADMIN') {
      socket.join('technicians');
      socket.join('admins');
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: User ${user.email}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized! Call initSocketServer first.');
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToTechnicians = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to('technicians').emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
