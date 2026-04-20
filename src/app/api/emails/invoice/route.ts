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

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, sendType } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, message: "Invoice ID required" },
        { status: 400 }
      );
    }

    await getFirebaseApp();
    const db = getFirestore();

    let invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    let invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc || !invoiceDoc.exists) {
      const snapshot = await db.collection(INVOICES_COLLECTION).where("invoiceNumber", "==", invoiceId).get();
      if (snapshot.empty) {
        return NextResponse.json(
          { success: false, message: "Invoice not found" },
          { status: 404 }
        );
      }
      invoiceDoc = snapshot.docs[0];
      invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceDoc.id);
    }

    const invoiceData = invoiceDoc.data() as any;

    const { sendInvoiceEmail } = await import("@/lib/email");

    const status = invoiceData.status === "paid" ? "paid" : "pending";

    const success = await sendInvoiceEmail({
      to: invoiceData.customerEmail,
      customerName: invoiceData.customerName,
      invoiceNumber: invoiceData.invoiceNumber,
      eventDate: invoiceData.eventDate,
      eventType: invoiceData.eventType,
      amount: invoiceData.amount,
      guests: invoiceData.guests,
      status: status as "pending" | "confirmed" | "paid",
      invoiceId: invoiceData.invoiceNumber,
    });

    if (success) {
      return NextResponse.json({ success: true, message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}