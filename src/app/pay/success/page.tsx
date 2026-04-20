"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Download, Mail, Home, Calendar } from "lucide-react";

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  eventType: string;
  eventDate: string;
  amount: number;
  paidAt: number;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceId) return;

      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-500 px-6 py-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-white text-xl font-bold">Payment Confirmed!</h1>
              <p className="text-white/80 text-sm">Thank you for your payment</p>
            </div>
          </div>

          <div className="p-6">
            {invoice && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    ₦{invoice.amount.toLocaleString()}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Invoice #{invoice.invoiceNumber}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-800">{invoice.customerName}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-500">Event Type</span>
                    <span className="font-medium text-slate-800">{invoice.eventType}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-500">Event Date</span>
                    <span className="font-medium text-slate-800">{invoice.eventDate}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-medium text-green-600">₦{invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-500">Date Paid</span>
                    <span className="font-medium text-slate-800">
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : "Today"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <Mail className="w-4 h-4" />
                    Email Receipt
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500 mb-3">
                Need help? Contact us at {process.env.NEXT_PUBLIC_COMPANY_EMAIL}
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}