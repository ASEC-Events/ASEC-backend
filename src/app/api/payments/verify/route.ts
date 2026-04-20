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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");
    const invoiceId = searchParams.get("invoiceId");

    if (!reference || !invoiceId) {
      return NextResponse.json(
        { success: false, message: "Missing parameters" },
        { status: 400 }
      );
    }

    await getFirebaseApp();
    const db = getFirestore();

    let invoiceDoc;
    let invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceId);
    invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc || !invoiceDoc.exists) {
      // Try by reference
      const snapshot = await db.collection(INVOICES_COLLECTION).where("paymentReference", "==", reference).get();
      if (!snapshot.empty) {
        invoiceDoc = snapshot.docs[0];
        invoiceRef = db.collection(INVOICES_COLLECTION).doc(invoiceDoc.id);
      } else {
        return NextResponse.json(
          { success: false, message: "Invoice not found" },
          { status: 404 }
        );
      }
    }

    const invoiceData = invoiceDoc?.data() || (await invoiceRef.get()).data() as any;

    if (invoiceData.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    if (invoiceData.paymentReference === reference) {
      await invoiceRef.update({
        status: "paid",
        paidAt: Date.now(),
        paymentStatus: "completed",
        updatedAt: Date.now(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    return NextResponse.json(
      { success: false, message: "Payment not verified" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}