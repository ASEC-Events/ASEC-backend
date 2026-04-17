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
    return initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
  return getApps()[0];
}

export async function GET() {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const docSnap = await db.collection("settings").doc("general").get();

    if (!docSnap.exists) {
      return NextResponse.json({
        venueName: "Alfred Susan Event Center",
        email: "",
        phone: "+2348033095758",
        address: "Kapital Hotel Street, Ijebu Ode 120101, Ogun State, Nigeria",
        timezone: "Africa/Lagos",
        currency: "NGN",
        language: "en",
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactorEnabled: false,
      });
    }

    return NextResponse.json(docSnap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const body = await request.json();

    const allowedFields = [
      "venueName",
      "email",
      "phone",
      "address",
      "emailNotifications",
      "smsNotifications",
      "marketingEmails",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "twoFactorEnabled",
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    await db.collection("settings").doc("general").set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}