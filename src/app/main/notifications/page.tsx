'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, Check, X } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => fetch(`/api/notifications?id=${n.id}`, { method: 'PATCH' }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_updated':
        return Calendar;
      default:
        return Bell;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Notifications</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDark 
                ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`p-4 flex items-start gap-4 ${
                    !notification.read 
                      ? (isDark ? 'bg-slate-700/50' : 'bg-blue-50') 
                      : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`p-2 rounded-lg ${
                          isDark 
                            ? 'hover:bg-slate-700 text-slate-400' 
                            : 'hover:bg-slate-100 text-slate-500'
                        }`}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className={`p-2 rounded-lg ${
                        isDark 
                          ? 'hover:bg-slate-700 text-slate-400' 
                          : 'hover:bg-slate-100 text-slate-500'
                      }`}
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No notifications yet</p>
          <p className="text-sm">You&apos;ll see alerts here when new bookings are made</p>
        </div>
      )}
    </div>
  );
}