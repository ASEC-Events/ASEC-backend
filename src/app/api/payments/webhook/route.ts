/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

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
const BOOKINGS_COLLECTION = "bookings";
const FINANCE_COLLECTION = "finance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    if (signature !== hash) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const data = event.data || {};
    const reference = data.reference;
    const amount = data.amount;
    const metadata = data.metadata || {};
    const invoiceId = metadata.invoiceId;
    const invoiceNumber = metadata.invoiceNumber;

    if (!invoiceId) {
      return NextResponse.json({ error: "No invoice ID" }, { status: 400 });
    }

    await getFirebaseApp();
    const db = getFirestore();

    const invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) {
      // Try by invoice number
      const snapshot = await db.collection(INVOICES_COLLECTION).where("invoiceNumber", "==", invoiceId).get();
      if (snapshot.empty) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
    }

    const invoiceData = invoiceDoc?.data() as any;

    if (invoiceData?.status === "paid") {
      return NextResponse.json({ received: true });
    }

    await invoiceRef.update({
      status: "paid",
      paidAt: Date.now(),
      paymentReference: reference,
      paymentStatus: "completed",
      amount: amount / 100,
      updatedAt: Date.now(),
    });

    const bookingId = invoiceData.bookingId;
    if (bookingId) {
      await db.collection(BOOKINGS_COLLECTION).doc(bookingId).update({
        status: "confirmed",
        paymentReference: reference,
        paidAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "Event Center";
    const financeRef = db.collection(FINANCE_COLLECTION).doc();
    await financeRef.set({
      description: `Payment for Invoice ${invoiceNumber || invoiceId}`,
      category: "Event Payment",
      amount: amount / 100,
      type: "income",
      date: Date.now(),
      paymentMethod: "Paystack",
      invoiceId: invoiceId,
      bookingId: bookingId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("Payment processed successfully:", invoiceId);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}