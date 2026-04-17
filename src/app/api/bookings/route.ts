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

export async function POST(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    
    const data = await request.json();
    const { fullName, eventType, eventDate, expectedGuests } = data;

    if (!fullName || !eventType || !eventDate || !expectedGuests) {
      return NextResponse.json(
        { error: "Full name, event type, event date, and expected guests are required" },
        { status: 400 }
      );
    }

    const bookingRef = db.collection("bookings").doc();
    await bookingRef.set({
      ...data,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      id: bookingRef.id,
    });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    getFirebaseApp();
    const db = getFirestore();    
    let snapshot;
    try {
      snapshot = await db.collection("bookings").orderBy("createdAt", "desc").get();
    } catch (orderError) {
      snapshot = await db.collection("bookings").get();
    }
    
    
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db.collection("bookings").doc(id).update({
      ...data,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
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

    await db.collection("bookings").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}