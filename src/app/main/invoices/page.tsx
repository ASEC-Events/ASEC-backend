"use client";

import { useState, useEffect } from "react";
import { FileText, Send, CheckCircle, Clock, Search, Plus, X, Mail, Trash2 } from "lucide-react";
import { useTheme } from "../../components/ThemeProvider";
import { useToast } from "../../components/Toast";

interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  amount: number;
  guests: number;
  status: "pending" | "sent" | "paid";
  sentAt?: number;
  paidAt?: number;
  createdAt: number;
}

interface Booking {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  expectedGuests: string;
  status: string;
  amount?: number;
}

export default function InvoicesPage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === "dark";
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [invoicesRes, bookingsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/bookings"),
      ]);

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "sent":
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return isDark ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-700";
      case "sent":
        return isDark ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-700";
      default:
        return isDark ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-700";
    }
  };

  const bookingsWithInvoices = invoices.map((inv) => inv.bookingId);
  const availableBookings = bookings.filter(
    (b) => !bookingsWithInvoices.includes(b.id) && b.status !== "cancelled"
  );

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvoice = async (booking: Booking, sendEmail: boolean) => {
    try {
      const action = sendEmail ? "send" : "create";
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: parseFloat(amount) || 0,
          action,
        }),
      });

      if (res.ok) {
        const invoice = await res.json();
        setInvoices((prev) => [invoice, ...prev]);
        setShowModal(false);
        setSelectedBooking(null);
        setAmount("");
        showToast(sendEmail ? "Invoice sent successfully!" : "Invoice created successfully!", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to create invoice", "error");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      showToast("Failed to create invoice", "error");
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setSending(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: invoice.bookingId,
          action: "send",
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === updated.id ? updated : inv))
        );
        showToast("Invoice sent successfully!", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to send invoice", "error");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      showToast("Failed to send invoice", "error");
    } finally {
      setSending(false);
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: invoice.bookingId,
          action: "markPaid",
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === updated.id ? updated : inv))
        );
        showToast("Invoice marked as paid!", "success");
      } else {
        showToast("Failed to update invoice", "error");
      }
    } catch (error) {
      console.error("Error updating invoice:", error);
      showToast("Failed to update invoice", "error");
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return;

    try {
      const res = await fetch(`/api/invoices?id=${deleteInvoice.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== deleteInvoice.id));
        setDeleteInvoice(null);
        showToast("Invoice deleted!", "success");
      } else {
        showToast("Failed to delete invoice", "error");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showToast("Failed to delete invoice", "error");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
          Invoices
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>

      <div className={`card ${isDark ? "bg-slate-800 border-slate-700" : "bg-white"}`}>
        <div className="p-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input pl-10 w-full ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? "bg-slate-700/50" : "bg-slate-50"}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Invoice #
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Customer
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Event
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Date
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Amount
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className={isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                    <td className={`px-4 py-3 text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                      <div>
                        <p className="font-medium">{invoice.customerName}</p>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {invoice.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                      {invoice.eventType}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? "text-white" : "text-slate-800"}`}>
                      {invoice.eventDate}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}>
                      ${invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {invoice.status === "pending" && (
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={sending}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Send Invoice"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.status !== "paid" && (
                          <button
                            onClick={() => handleMarkPaid(invoice)}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteInvoice(invoice)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`px-4 py-8 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No invoices found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-lg shadow-xl ${isDark ? "bg-slate-800" : "bg-white"}`}
          >
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
              <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                Create Invoice
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                  setAmount("");
                }}
                className={`p-1 rounded ${isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}
              >
                <X className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {!selectedBooking ? (
                <div>
                  <label className="label">Select Booking</label>
                  <select
                    onChange={(e) => {
                      const booking = bookings.find((b) => b.id === e.target.value);
                      setSelectedBooking(booking || null);
                      if (booking?.amount) {
                        setAmount(booking.amount.toString());
                      }
                    }}
                    className={`input w-full ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                  >
                    <option value="">Select a booking...</option>
                    {availableBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.fullName} - {booking.eventType} ({booking.eventDate})
                      </option>
                    ))}
                  </select>
                  {availableBookings.length === 0 && (
                    <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      No bookings available. All bookings already have invoices.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
                    <p className={`font-medium ${isDark ? "text-white" : "text-slate-800"}`}>
                      {selectedBooking.fullName}
                    </p>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {selectedBooking.email}
                    </p>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {selectedBooking.eventType} - {selectedBooking.eventDate}
                    </p>
                  </div>

                  <div>
                    <label className="label">Amount ($)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className={`input w-full ${isDark ? "bg-slate-700 border-slate-600 text-white" : ""}`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCreateInvoice(selectedBooking, false)}
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                          : "border-slate-300 text-slate-700 hover:bg-slate-100"
                      } transition-colors`}
                    >
                      Create Only
                    </button>
                    <button
                      onClick={() => handleCreateInvoice(selectedBooking, true)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Create & Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Delete Invoice
            </h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Are you sure you want to delete invoice <span className="font-medium">{deleteInvoice.invoiceNumber}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDeleteInvoice(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteInvoice} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}