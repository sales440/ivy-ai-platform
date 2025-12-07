import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface PushNotification {
  id: string;
  type: 'milestone' | 'ab_test' | 'churn' | 'performance';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

/**
 * Hook for real-time WebSocket notifications
 */
export function useWebSocketNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io({
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      
      // Subscribe to all notification types
      socket.emit('subscribe', 'notifications:milestone');
      socket.emit('subscribe', 'notifications:ab_test');
      socket.emit('subscribe', 'notifications:churn');
      socket.emit('subscribe', 'notifications:performance');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('notification', (notification: PushNotification) => {
      console.log('[WebSocket] Notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Show toast notification
      const toastConfig = {
        duration: 5000,
      };

      switch (notification.severity) {
        case 'critical':
          toast.error(notification.title, {
            description: notification.message,
            ...toastConfig,
          });
          break;
        case 'warning':
          toast.warning(notification.title, {
            description: notification.message,
            ...toastConfig,
          });
          break;
        case 'success':
          toast.success(notification.title, {
            description: notification.message,
            ...toastConfig,
          });
          break;
        default:
          toast.info(notification.title, {
            description: notification.message,
            ...toastConfig,
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    clearNotifications,
  };
}
