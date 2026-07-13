import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '../components/Toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketUrl = 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket.io client connected');
      setConnected(true);
      newSocket.emit('join', user.id);
    });

    newSocket.on('notification', (notification: { type: string; message: string }) => {
      console.log('Realtime Notification Received:', notification);
      
      let toastType: 'success' | 'error' | 'info' = 'info';
      if (
        notification.type === 'borrow_success' || 
        notification.type === 'return_success' || 
        notification.type === 'reserve_success'
      ) {
        toastType = 'success';
      } else if (notification.type === 'overdue' || notification.type === 'fine') {
        toastType = 'error';
      }

      showToast(notification.message, toastType);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io client disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
