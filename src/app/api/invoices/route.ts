/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
  return getApps()[0];
}

const INVOICES_COLLECTION = "invoices";

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
  updatedAt: number;
}

export async function GET() {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const snapshot = await db
      .collection(INVOICES_COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const invoices: Invoice[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Invoice, "id">),
    }));

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const data = await request.json();
    const { bookingId, action, amount } = data;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const bookingSnapshot = await db.collection("bookings").doc(bookingId).get();
    if (!bookingSnapshot.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingSnapshot.data() as any;

    const existingInvoicesSnapshot = await db
      .collection(INVOICES_COLLECTION)
      .where("bookingId", "==", bookingId)
      .get();

    let invoice: Invoice;

    if (!existingInvoicesSnapshot.empty) {
      const existingInvoice = existingInvoicesSnapshot.docs[0];
      const existingData = existingInvoice.data() as Invoice;

      if (action === "send" || action === "resend") {
        const { sendInvoiceEmail, generateInvoiceNumber } = await import("@/lib/email");

        const invoiceNumber = existingData.invoiceNumber || generateInvoiceNumber();
        const emailSent = await sendInvoiceEmail({
          to: booking.email,
          customerName: booking.fullName,
          invoiceNumber,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
          amount: amount || existingData.amount || 0,
          guests: parseInt(booking.expectedGuests) || 0,
          status: booking.status === "paid" ? "paid" : "pending",
          bookingId: bookingId,
        });

        if (!emailSent) {
          return NextResponse.json(
            { error: "Failed to send email. Please check SMTP configuration." },
            { status: 500 }
          );
        }

        await db.collection(INVOICES_COLLECTION).doc(existingInvoice.id).update({
          status: "sent",
          sentAt: Date.now(),
          invoiceNumber,
          amount: amount || existingData.amount || 0,
          updatedAt: Date.now(),
        });

        invoice = {
          ...existingData,
          id: existingInvoice.id,
          status: "sent",
          sentAt: Date.now(),
          invoiceNumber,
          amount: amount || existingData.amount || 0,
        };
      } else if (action === "markPaid") {
        await db.collection(INVOICES_COLLECTION).doc(existingInvoice.id).update({
          status: "paid",
          paidAt: Date.now(),
          updatedAt: Date.now(),
        });

        invoice = {
          ...existingData,
          id: existingInvoice.id,
          status: "paid",
          paidAt: Date.now(),
        };
      } else {
        invoice = {
          ...existingData,
          id: existingInvoice.id,
        };
      }
    } else {
      const { generateInvoiceNumber } = await import("@/lib/email");
      const invoiceNumber = generateInvoiceNumber();

      const invoiceRef = db.collection(INVOICES_COLLECTION).doc();
      const invoiceId = invoiceRef.id;

      const newInvoice = {
        bookingId,
        invoiceNumber,
        customerName: booking.fullName,
        customerEmail: booking.email,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        amount: amount || booking.amount || 0,
        guests: parseInt(booking.expectedGuests) || 0,
        status: "pending" as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await invoiceRef.set(newInvoice);

      invoice = {
        id: invoiceId,
        ...newInvoice,
      };

      if (action === "send" || action === "resend") {
        const { sendInvoiceEmail } = await import("@/lib/email");

        const emailSent = await sendInvoiceEmail({
          to: booking.email,
          customerName: booking.fullName,
          invoiceNumber,
          eventDate: booking.eventDate,
          eventType: booking.eventType,
          amount: amount || booking.amount || 0,
          guests: parseInt(booking.expectedGuests) || 0,
          status: booking.status === "paid" ? "paid" : "pending",
          bookingId: bookingId,
        });

        if (!emailSent) {
          return NextResponse.json(
            { error: "Failed to send email. Please check SMTP configuration." },
            { status: 500 }
          );
        }

        await db.collection(INVOICES_COLLECTION).doc(invoiceId).update({
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });

        invoice.status = "sent";
        invoice.sentAt = Date.now();
      }
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.collection(INVOICES_COLLECTION).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}