import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // Allow all origins for dev simplicity
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    // Join room based on user ID to send targeted notifications
    socket.on('join', (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit real-time notification to a specific user
export const emitNotification = (userId: string, type: string, message: string, data?: any) => {
  if (io) {
    io.to(userId.toString()).emit('notification', {
      type,
      message,
      data,
      createdAt: new Date(),
    });
  }
};

// Broadcast notification to all connected sockets
export const broadcastNotification = (type: string, message: string, data?: any) => {
  if (io) {
    io.emit('notification', {
      type,
      message,
      data,
      createdAt: new Date(),
    });
  }
};
