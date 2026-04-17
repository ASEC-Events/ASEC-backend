"use client";

import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../components/ThemeProvider";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

function MainContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, mounted } = useTheme();
  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar isOpen={false} onClose={() => {}} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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