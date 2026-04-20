"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, CreditCard } from "lucide-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  amount: number;
  guests: number;
  status: string;
}

function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = searchParams.get("invoice");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceId) {
        setError("No invoice specified");
        setLoading(false);
        return;
      }

      try {
        let res = await fetch(`/api/invoices?id=${invoiceId}`);
        if (!res.ok) {
          res = await fetch(`/api/invoices?number=${invoiceId}`);
        }
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Invoice not found");
        }
        const data = await res.json();
        setInvoice(data);
        setEmail(data.customerEmail || "");
        setName(data.customerName || "");
      } catch (err: any) {
        setError(err.message || "Invoice not found");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  const initializePayment = async () => {
    if (!invoice || !email) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          email,
          name,
          amount: invoice.amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      const url = data.authorizationUrl || data.authorization_url || data.data?.authorization_url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Invalid payment response");
      }
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Payment Error</h1>
          <p className="text-slate-600">{error || "Invoice not found"}</p>
        </div>
      </div>
    );
  }

  if (invoice.status === "paid") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Already Paid</h1>
          <p className="text-slate-600">This invoice has already been paid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-primary px-6 py-4">
            <h1 className="text-white text-xl font-bold">Complete Payment</h1>
            <p className="text-white/80 text-sm">{process.env.NEXT_PUBLIC_COMPANY_NAME}</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">₦{invoice.amount.toLocaleString()}</h2>
              <p className="text-slate-500 text-sm">Invoice #{invoice.invoiceNumber}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={initializePayment}
              disabled={processing || !email || !name}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ₦{invoice.amount.toLocaleString()}
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-medium text-slate-800 mb-3">Payment Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Customer</dt>
                  <dd className="text-slate-800 font-medium">{invoice.customerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Event Type</dt>
                  <dd className="text-slate-800">{invoice.eventType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Event Date</dt>
                  <dd className="text-slate-800">{invoice.eventDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Guests</dt>
                  <dd className="text-slate-800">{invoice.guests} guests</dd>
                </div>
              </dl>
            </div>

            <p className="mt-6 text-xs text-slate-500 text-center">
              Secured by Paystack. Your payment information is encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PayPageContent />
    </Suspense>
  );
}