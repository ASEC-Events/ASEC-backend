'use client';

import { } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings,
  Bell,
  X,
  FileText
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount?: number;
}

const navigation = [
  { name: 'Dashboard', href: '/main', icon: LayoutDashboard },
  { name: 'Events', href: '/main/events', icon: Calendar },
  { name: 'Invoices', href: '/main/invoices', icon: FileText },
  { name: 'Finance', href: '/main/finance', icon: DollarSign },
  { name: 'Staff', href: '/main/staff', icon: Users },
  { name: 'Notifications', href: '/main/notifications', icon: Bell, showBadge: true },
  { name: 'Settings', href: '/main/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { theme, mounted } = useTheme();

  const isDark = mounted && theme === 'dark';

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto
        ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}
        ${isDark ? 'shadow-2xl shadow-black' : 'shadow-lg'}
        border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}
      `}>
        <div className={`flex items-center justify-between h-20 px-4 ${isDark ? 'border-b border-slate-700' : 'border-b border-slate-200'}`}>
          <h1 className="text-xl font-bold text-primary">ASEC Admin</h1>
          <button onClick={onClose} className="md:hidden">
            <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-600'}`} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : isDark 
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}