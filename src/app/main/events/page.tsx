"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Info, X } from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";
import { useToast } from "../../components/Toast";

interface Event {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  expectedGuests: string;
  description: string;
  specialRequests: string;
  status: string;
  createdAt: number;
}

const eventTypes = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate Event" },
  { value: "birthday", label: "Birthday Party" },
  { value: "conference", label: "Conference" },
  { value: "concert", label: "Concert/Show" },
  { value: "festival", label: "Festival" },
  { value: "product-launch", label: "Product Launch" },
  { value: "other", label: "Other" },
];

const guestOptions = [
  { value: "50", label: "Up to 50" },
  { value: "100", label: "Up to 100" },
  { value: "200", label: "Up to 200" },
  { value: "300", label: "Up to 300" },
  { value: "400", label: "Up to 400" },
  { value: "500", label: "Up to 500" },
];

export default function EventsPage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const { showToast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShowModal(false);
    }
  }, []);

  useEffect(() => {
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModal, handleClickOutside]);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    expectedGuests: "",
    description: "",
    specialRequests: "",
    status: "pending",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await fetch(`/api/bookings?id=${editingEvent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        showToast("Event updated successfully", "success");
      } else {
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            bookingSource: "admin",
          }),
        });
        showToast("Event added successfully", "success");
      }

      setShowModal(false);
      setEditingEvent(null);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        eventType: "",
        eventDate: "",
        expectedGuests: "",
        description: "",
        specialRequests: "",
        status: "pending",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      fullName: event.fullName || "",
      email: event.email || "",
      phone: event.phone || "",
      eventType: event.eventType || "",
      eventDate: event.eventDate || "",
      expectedGuests: event.expectedGuests || "",
      description: event.description || "",
      specialRequests: event.specialRequests || "",
      status: event.status || "pending",
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    try {
      await fetch(`/api/bookings?id=${deleteEvent.id}`, { method: "DELETE" });
      showToast("Event deleted successfully", "success");
      fetchEvents();
    } catch (error) {
      showToast("Failed to delete event", "error");
    } finally {
      setDeleteEvent(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return isDark ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-700";
      case "pending":
        return isDark ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-700";
      case "completed":
        return isDark ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-700";
      case "cancelled":
        return isDark ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700";
      default:
        return isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700";
    }
  };

  const getEventTypeLabel = (value: string) => {
    return eventTypes.find(t => t.value === value)?.label || value;
  };

  const getGuestsLabel = (value: string) => {
    return guestOptions.find(g => g.value === value)?.label || value;
  };

  const filteredEvents = events.filter((event) =>
    event.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Events</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Manage your event bookings</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setFormData({
              fullName: "",
              email: "",
              phone: "",
              eventType: "",
              eventDate: "",
              expectedGuests: "",
              description: "",
              specialRequests: "",
              status: "pending",
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Guest Name</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Event</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Date</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Guests</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50'}`}
                  >
                    <td className="py-4 px-4">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.fullName}</p>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={isDark ? 'text-slate-300' : 'text-slate-800'}>{getEventTypeLabel(event.eventType)}</p>
                    </td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{event.eventDate}</td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{getGuestsLabel(event.expectedGuests)}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewEvent(event)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                          <Info className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </button>
                        <button onClick={() => handleEdit(event)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                          <Edit className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                        </button>
                        <button onClick={() => setDeleteEvent(event)} className="p-2 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={`py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className={`relative rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-3 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {editingEvent ? "Edit Event" : "Add Event"}
              </h2>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <X className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Type *</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Event Date *</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="input w-full  xs:max-w-full"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Expected Guests *</label>
                  <select
                    value={formData.expectedGuests}
                    onChange={(e) => setFormData({ ...formData, expectedGuests: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select guests</option>
                    {guestOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Event Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-20"
                  placeholder="Tell us about your event..."
                />
              </div>

              <div>
                <label className="label">Special Requests</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  className="input min-h-20"
                  placeholder="Any special requests..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEvent ? "Update Event" : "Add Event"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {deleteEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Delete Event
            </h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Are you sure you want to delete <span className="font-medium">{deleteEvent.fullName}</span>&apos;s event?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDeleteEvent(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewEvent(null)}>
          <div className={`rounded-xl w-full max-w-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Event Details</h2>
              <button onClick={() => setViewEvent(null)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
                <X className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Guest Name</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEvent.fullName}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Event Type</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{getEventTypeLabel(viewEvent.eventType)}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Event Date</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewEvent.eventDate}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Expected Guests</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{getGuestsLabel(viewEvent.expectedGuests)}</p>
                </div>
                {viewEvent.email && (
                  <div className="col-span-2">
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email</p>
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-800'}`} title={viewEvent.email}>{viewEvent.email}</p>
                  </div>
                )}
                {viewEvent.phone && (
                  <div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Phone</p>
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-800'}`} title={viewEvent.phone}>{viewEvent.phone}</p>
                  </div>
                )}
              </div>
              
              {viewEvent.description && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</p>
                  <p className={`mt-1 p-3 rounded-lg max-h-24 overflow-y-auto ${isDark ? 'bg-slate-700' : 'bg-slate-50'} ${isDark ? 'text-white' : 'text-slate-800'}`} title={viewEvent.description}>
                    {viewEvent.description}
                  </p>
                </div>
              )}
              
              {viewEvent.specialRequests && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Special Requests</p>
                  <p className={`mt-1 p-3 rounded-lg max-h-24 overflow-y-auto ${isDark ? 'bg-slate-700' : 'bg-slate-50'} ${isDark ? 'text-white' : 'text-slate-800'}`} title={viewEvent.specialRequests}>
                    {viewEvent.specialRequests}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setViewEvent(null)} className="btn-secondary">Close</button>
              <button onClick={() => { setViewEvent(null); handleEdit(viewEvent); }} className="btn-primary">Edit Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
