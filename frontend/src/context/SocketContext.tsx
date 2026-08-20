import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { NotificationItem } from '../types';
import { api } from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  notifications: NotificationItem[];
  unreadCount: number;
  toastMessage: string | null;
  clearToast: () => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    fetchNotifications();

    const socketClient = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketClient.on('connect', () => {
      console.log('⚡ Socket connected to server');
    });

    socketClient.on('ticket:created', (data) => {
      setToastMessage(`🎫 New Ticket Created: #${data.ticketCode} - ${data.title}`);
      fetchNotifications();
    });

    socketClient.on('ticket:assigned', (data) => {
      setToastMessage(`👤 Ticket #${data.ticketCode} has been assigned to you`);
      fetchNotifications();
    });

    socketClient.on('ticket:status_changed', (data) => {
      setToastMessage(`🔄 Ticket #${data.ticketCode} status changed to ${data.status}`);
      fetchNotifications();
    });

    socketClient.on('ticket:comment_added', (data) => {
      setToastMessage(`💬 New reply on Ticket #${data.ticketId}: "${data.comment.substring(0, 30)}..."`);
      fetchNotifications();
    });

    socketClient.on('monitoring:alert', (data) => {
      setToastMessage(`🚨 System Alert: ${data.message}`);
      fetchNotifications();
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [isAuthenticated, token]);

  const clearToast = () => setToastMessage(null);

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        toastMessage,
        clearToast,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-800 border border-brand-500/50 text-white px-4 py-3 rounded-xl shadow-2xl shadow-brand-500/10 animate-bounce">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={clearToast}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
