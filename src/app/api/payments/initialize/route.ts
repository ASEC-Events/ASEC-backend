/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Paystack from "paystack-node";

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
    await getFirebaseApp();
    const db = getFirestore();

    const { invoiceId, email, name, amount } = await request.json();

    if (!invoiceId || !email || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let invoiceDoc;
    let invoiceRef;
    
    invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    invoiceDoc = await invoiceRef.get();
    
    if (!invoiceDoc.exists) {
      const snapshot = await db.collection(INVOICES_COLLECTION).where("invoiceNumber", "==", invoiceId).get();
      if (!snapshot.empty) {
        invoiceDoc = snapshot.docs[0];
        invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceDoc.id);
      }
    }

    if (!invoiceDoc || !invoiceDoc.exists) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoiceData = invoiceDoc.data() as any;

    if (invoiceData.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || "");
    
    const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_URL?.replace("/pay", "") || 
      process.env.VERCEL_URL || 
      "http://localhost:3000";

    const callbackUrl = `${baseUrl}/pay/callback?invoice=${invoiceId}`;
    
    const initializeArgs = {
      email,
      amount: Math.round(amount * 100),
      currency: "NGN",
      metadata: JSON.stringify({
        invoiceId,
        customerName: name,
        invoiceNumber: invoiceData.invoiceNumber,
      }),
      callbackUrl,
      redirectUrl: callbackUrl,
    };

    const response = await paystack.initializeTransaction(initializeArgs);

    const success = response.body?.status === true || response.status === true;

    if (!success) {
      return NextResponse.json(
        { error: response.body?.message || response.message || "Failed to initialize payment" },
        { status: 500 }
      );
    }

    await invoiceRef.update({
      paymentReference: response.body?.data?.reference || response.data?.reference,
      paymentStatus: "pending",
      customerEmail: email,
      customerName: name,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: response.body?.data?.authorization_url || response.data?.authorization_url,
      reference: response.body?.data?.reference || response.data?.reference,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}