'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import Link from 'next/link';

interface Booking {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  expectedGuests: string;
  description: string;
  status: string;
  createdAt: number;
  updatedAt?: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date?: string;
  createdAt?: number;
}

interface StaffMember {
  id: string;
  status?: string;
  createdAt?: number;
  hireDate?: string;
}

interface Stats {
  totalBookings: number;
  totalStaff: number;
  monthlyRevenue: number;
  pendingBookings: number;
  bookingsChange: number;
  staffChange: number;
  revenueChange: number;
  pendingChange: number;
}

type TrendDirection = 'up' | 'down' | 'neutral';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getTimestamp(value: number | string | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function isInRange(
  value: number | string | undefined,
  rangeStart: number,
  rangeEnd: number,
) {
  const timestamp = getTimestamp(value);
  return timestamp !== null && timestamp >= rangeStart && timestamp < rangeEnd;
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function getTrendDirection(change: number): TrendDirection {
  if (change > 0) {
    return 'up';
  }

  if (change < 0) {
    return 'down';
  }

  return 'neutral';
}

function formatChange(change: number) {
  return `${change > 0 ? '+' : ''}${change}%`;
}

const eventTypeLabels: Record<string, string> = {
  wedding: "Wedding",
  corporate: "Corporate Event",
  birthday: "Birthday Party",
  conference: "Conference",
  concert: "Concert/Show",
  festival: "Festival",
  "product-launch": "Product Launch",
  other: "Other"
};

export default function DashboardPage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    totalStaff: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
    bookingsChange: 0,
    staffChange: 0,
    revenueChange: 0,
    pendingChange: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const now = new Date();
        const currentMonthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).getTime();
        const nextMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          1,
        ).getTime();
        const previousMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        ).getTime();

        const [bookingsRes, transactionsRes, staffRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/finance?limit=100'),
          fetch('/api/staff')
        ]);

        const bookingsData = await bookingsRes.json();
        const transactionsData = await transactionsRes.json();
        const staffData = await staffRes.json();

        const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
        const transactionsArray = Array.isArray(transactionsData) ? transactionsData : [];
        const staffArray = Array.isArray(staffData) ? staffData : [];

        setBookings(bookingsArray);
        setTransactions(transactionsArray.slice(0, 10));
        
        const currentMonthTransactions = transactionsArray.filter((t: Transaction) => {
          return isInRange(
            t.date ?? t.createdAt,
            currentMonthStart,
            nextMonthStart,
          );
        });
        
        const prevMonthTransactions = transactionsArray.filter((t: Transaction) => {
          return isInRange(
            t.date ?? t.createdAt,
            previousMonthStart,
            currentMonthStart,
          );
        });

        const currentRevenue = currentMonthTransactions
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
          
        const prevRevenue = prevMonthTransactions
          .filter((t: Transaction) => t.type === 'income')
          .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

        const currentMonthBookings = bookingsArray.filter((b: Booking) => {
          return isInRange(b.createdAt, currentMonthStart, nextMonthStart);
        });
        
        const prevMonthBookings = bookingsArray.filter((b: Booking) => {
          return isInRange(b.createdAt, previousMonthStart, currentMonthStart);
        });

        const currentMonthStaff = staffArray.filter((member: StaffMember) => {
          return isInRange(
            member.hireDate ?? member.createdAt,
            currentMonthStart,
            nextMonthStart,
          );
        });

        const prevMonthStaff = staffArray.filter((member: StaffMember) => {
          return isInRange(
            member.hireDate ?? member.createdAt,
            previousMonthStart,
            currentMonthStart,
          );
        });

        const currentMonthPendingBookings = currentMonthBookings.filter(
          (booking: Booking) => booking.status === 'pending',
        );

        const prevMonthPendingBookings = prevMonthBookings.filter(
          (booking: Booking) => booking.status === 'pending',
        );

        setStats({
          totalBookings: bookingsArray.length,
          totalStaff: staffArray.length,
          monthlyRevenue: currentRevenue,
          pendingBookings: bookingsArray.filter((b: Booking) => b.status === 'pending').length,
          bookingsChange: calculatePercentageChange(
            currentMonthBookings.length,
            prevMonthBookings.length,
          ),
          staffChange: calculatePercentageChange(
            currentMonthStaff.length,
            prevMonthStaff.length,
          ),
          revenueChange: calculatePercentageChange(currentRevenue, prevRevenue),
          pendingChange: calculatePercentageChange(
            currentMonthPendingBookings.length,
            prevMonthPendingBookings.length,
          ),
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return '₦' + amount.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcomingBookings = bookings
    .filter(b => b.eventDate)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5);

  const statsData = [
    {
      name: 'Total Bookings',
      value: stats.totalBookings.toString(),
      change: formatChange(stats.bookingsChange),
      trend: getTrendDirection(stats.bookingsChange),
      caption: 'new bookings vs last month',
      icon: Calendar,
    },
    {
      name: 'Total Staff',
      value: stats.totalStaff.toString(),
      change: formatChange(stats.staffChange),
      trend: getTrendDirection(stats.staffChange),
      caption: 'new staff vs last month',
      icon: Users,
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      change: formatChange(stats.revenueChange),
      trend: getTrendDirection(stats.revenueChange),
      caption: 'vs last month',
      icon: DollarSign,
    },
    {
      name: 'Pending Bookings',
      value: stats.pendingBookings.toString(),
      change: formatChange(stats.pendingChange),
      trend: getTrendDirection(stats.pendingChange),
      caption: 'new pending vs last month',
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Dashboard</h1>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <div key={stat.name} className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{stat.name}</p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : stat.trend === 'down' ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              )}
              <span className={`text-sm font-medium ${
                stat.trend === 'up'
                  ? 'text-green-500'
                  : stat.trend === 'down'
                    ? 'text-red-500'
                    : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
              }`}>
                {stat.change}
              </span>
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>{stat.caption}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Upcoming Events</h2>
            <Link href="/main/events" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{booking.fullName}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {eventTypeLabels[booking.eventType] || booking.eventType} • {booking.eventDate} • {booking.expectedGuests} guests
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' 
                      ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                      : booking.status === 'pending'
                      ? isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      : isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No events found</p>
            )}
          </div>
        </div>

        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Transactions</h2>
            <Link href="/main/finance" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{transaction.description}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{transaction.date}</p>
                  </div>
                  <span className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No transactions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
