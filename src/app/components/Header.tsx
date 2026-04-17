'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, Sun, Moon, X, ChevronRight, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useToast } from './Toast';

interface HeaderProps {
  onMenuClick: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'New Booking', message: 'John Doe booked Event Hall A', time: '2 min ago', read: false },
  { id: '2', title: 'Payment Received', message: '₦50,000 from Sarah Smith', time: '1 hour ago', read: false },
  { id: '3', title: 'Booking Cancelled', message: 'Michael cancelled the wedding hall', time: '3 hours ago', read: true },
];

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { showToast } = useToast();
  const isDark = mounted && theme === 'dark';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setShowNotifications(false);
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    router.push('/notifications');
  };

  const handleProfileClick = () => {
    setShowProfile(false);
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    setShowProfile(false);
    router.push('/main/settings');
  };

  const handleSignOut = async () => {
    setShowProfile(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast("Signed out successfully", "success");
    window.location.href = '/login';
  };

  return (
    <header className={`p-4 h-20 flex items-center justify-between sticky top-0 z-30 border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          <Menu className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        </button>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Admin Panel</h2>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          {theme === 'light' ? (
            <Moon className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
          ) : (
            <Sun className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className={`p-2 rounded-lg relative ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <Bell className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                  <X className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick()}
                    className={`w-full p-4 border-b text-left ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'} ${!notif.read ? (isDark ? 'bg-slate-700/50' : 'bg-blue-50') : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.read && <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{notif.title}</p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{notif.time}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className={`p-3 text-center ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                <button 
                  onClick={handleViewAllNotifications}
                  className={`text-sm ${isDark ? 'text-primary hover:text-indigo-400' : 'text-primary hover:underline'}`}
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500' : 'bg-primary'}`}>
              <User className="w-4 h-4 text-white" />
            </div>
          </button>

          {showProfile && (
            <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Admin User</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>admin@asec.com</p>
              </div>
              <div className="py-2">
                <button 
                  onClick={handleProfileClick}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button 
                  onClick={handleSettingsClick}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className={`py-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button 
                  onClick={handleSignOut}
                  className={`w-full px-4 py-2 text-left text-red-500 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}