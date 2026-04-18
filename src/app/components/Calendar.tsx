'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarEvent {
  id: string;
  fullName: string;
  eventType: string;
  eventDate: string;
  status: string;
  phone?: string;
  expectedGuests?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  isDark?: boolean;
}

export default function Calendar({ events, isDark }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const calendarRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const eventDates = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    if (!events || !Array.isArray(events)) return map;
    events.forEach(event => {
      if (event.eventDate && event.status !== 'cancelled') {
        const dateKey = event.eventDate;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      }
    });
    return map;
  }, [events]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setSelectedDate('');
      }
    };
    if (selectedDate) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedDate]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: '' });
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, isCurrentMonth: true, date: dateStr });
  }
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) days.push({ day: i, isCurrentMonth: false, date: '' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div ref={calendarRef} className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
          <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        </button>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {monthNames[month]} {year}
        </h3>
        <button onClick={nextMonth} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className={`text-center text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const hasEvent = day.date && eventDates[day.date];
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const isSelected = day.date === selectedDate && hasEvent;
          
          return (
            <div key={index} className="relative">
              <div
                className={`
                  relative p-2 text-center text-sm min-h-[40px] flex flex-col items-center justify-start cursor-pointer 
                  ${!day.isCurrentMonth ? (isDark ? 'text-slate-600' : 'text-slate-300') : ''} 
                  ${isToday ? 'ring-2 ring-primary rounded-md' : ''} 
                  ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}
                `}
                onClick={() => setSelectedDate(day.date === selectedDate ? '' : day.date)}
              >
                <span className={isDark ? 'text-white' : 'text-slate-800'}>{day.day}</span>
                {hasEvent && (
                  <div className="flex gap-0.5 mt-0.5">
                    {hasEvent.slice(0, 2).map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${getStatusColor(hasEvent[i].status)}`} />
                    ))}
                    {hasEvent.length > 2 && <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>+{hasEvent.length - 2}</span>}
                  </div>
                )}
              </div>
              
              {isSelected && (
                <div className={`absolute bottom-full right-0 mb-1 z-30 p-2 rounded-lg shadow-lg w-36 ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{day.date}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedDate(''); }} className={`p-0.5 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'}`}>
                      <X className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </button>
                  </div>
                  {eventDates[day.date].map((event, idx) => (
                    <div key={idx} className={`text-xs ${idx > 0 ? (isDark ? 'border-t border-slate-600' : 'border-t border-slate-200') : ''} pt-1 mt-1`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.fullName}</span>
                        <span className={`px-1 py-0.5 rounded text-[10px] ${getStatusColor(event.status)} text-white`}>{event.status}</span>
                      </div>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{event.eventType} • {event.expectedGuests || '0'} guests</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}