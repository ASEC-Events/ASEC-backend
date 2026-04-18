"use client";

import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../components/ThemeProvider";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

interface Notification {
  id: string;
  read: boolean;
}

function MainContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, mounted } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          const notifs = Array.isArray(data) ? data : [];
          const unread = notifs.filter((n: Notification) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar isOpen={false} onClose={() => {}} unreadCount={0} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
<main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} unreadCount={unreadCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainContent>{children}</MainContent>;
}