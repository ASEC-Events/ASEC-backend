"use client";

import { useState, useEffect } from "react";
import { FileText, Send, CheckCircle, Clock, Search, Plus, X, Mail, Trash2, Eye, Loader2, Copy } from "lucide-react";
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
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [emailing, setEmailing] = useState(false);

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
    setSending(true);
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
    } finally {
      setSending(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setSending(true);
    try {
      const action = invoice.status === "sent" ? "resend" : "send";
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: invoice.bookingId,
          action,
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

  const handleCopyLink = async (invoice: Invoice) => {
    const paymentUrl = `${process.env.NEXT_PUBLIC_PAYMENT_URL || 'https://asec-web-app.web.app/pay'}?invoice=${invoice.invoiceNumber}`;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      showToast("Payment link copied!", "success");
    } catch (error) {
      showToast("Failed to copy link", "error");
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
                       ₦{invoice.amount.toLocaleString()}
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
                        {invoice.status === "sent" && (
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            disabled={sending}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Resend Invoice"
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
                          onClick={() => handleCopyLink(invoice)}
                          className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors"
                          title="Copy Payment Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewInvoice(invoice)}
                          className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                    <label className="label">Amount (₦)</label>
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
                      disabled={sending}
                      className={`flex-1 px-4 py-2 rounded-lg border disabled:opacity-50 ${
                        isDark
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                          : "border-slate-300 text-slate-700 hover:bg-slate-100"
                      } transition-colors`}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Only"}
                    </button>
                    <button
                      onClick={() => handleCreateInvoice(selectedBooking, true)}
                      disabled={sending}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />Create & Send</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteInvoice(null)}>
          <div 
            className={`rounded-xl w-full max-w-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
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

      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewInvoice(null)}>
          <div 
            className={`rounded-xl w-full max-w-lg p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Invoice Preview
              </h2>
              <button 
                onClick={() => setViewInvoice(null)} 
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`rounded-lg p-4 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <div className="text-center mb-6 pb-4 border-b border-slate-300 dark:border-slate-600">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>ASEC Events</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Invoice {viewInvoice.invoiceNumber}</p>
              </div>

              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-4 ${viewInvoice.status === 'paid' ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') : viewInvoice.status === 'sent' ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700')}`}>
                {viewInvoice.status === 'paid' ? 'Receipt' : viewInvoice.status === 'sent' ? 'Sent' : 'Payment Request'}
              </div>

              <table className="w-full">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className={`py-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Customer</td>
                    <td className={`py-2 text-sm text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewInvoice.customerName}</td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email</td>
                    <td className={`py-2 text-sm text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewInvoice.customerEmail}</td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Event Type</td>
                    <td className={`py-2 text-sm text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewInvoice.eventType}</td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Event Date</td>
                    <td className={`py-2 text-sm text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewInvoice.eventDate}</td>
                  </tr>
                  <tr>
                    <td className={`py-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Guests</td>
                    <td className={`py-2 text-sm text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>{viewInvoice.guests} guests</td>
                  </tr>
                  <tr>
                    <td className={`py-3 text-base font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>Total</td>
                    <td className={`py-3 text-base font-bold text-right ${isDark ? 'text-white' : 'text-slate-800'}`}>₦{viewInvoice.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className={`mt-4 pt-4 border-t border-slate-300 dark:border-slate-600 text-center`}>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ASEC Events</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>info@asecevents.com</p>
              </div>
            </div>

            <button
              onClick={async () => {
                setEmailing(true);
                try {
                  const res = await fetch("/api/emails/invoice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invoiceId: viewInvoice.id }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    showToast("Receipt email sent successfully", "success");
                    setViewInvoice(null);
                  } else {
                    showToast(data.message || "Failed to send email", "error");
                  }
                } catch (error) {
                  showToast("Failed to send email", "error");
                } finally {
                  setEmailing(false);
                }
              }}
              disabled={emailing}
              className={`w-full mt-4 py-2.5 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50`}
            >
              {emailing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Email Receipt
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}