/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* ---------------- Firebase Init ---------------- */

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

function getFirebaseApp() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
  return getApps()[0];
}

/* ---------------- Types ---------------- */

const NOTIFICATIONS_COLLECTION = "notifications";

type NotificationRecord = {
  type?: string;
  bookingSource?: string;
  source?: string;
  data?: {
    bookingSource?: string;
    source?: string;
  } | null;
  read?: boolean;
  createdAt?: number;
  updatedAt?: number;
};

type Notification = NotificationRecord & {
  id: string;
};

/* ---------------- Helpers ---------------- */

function isAdminBookingNotification(notification: Notification) {
  const notificationType = notification.type ?? "";

  const notificationSource =
    notification.bookingSource ??
    notification.source ??
    notification.data?.bookingSource ??
    notification.data?.source;

  return (
    typeof notificationType === "string" &&
    notificationType.startsWith("booking_") &&
    notificationSource === "admin"
  );
}

/* ---------------- GET ---------------- */
/* Fetch notifications */

export async function GET(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    let snapshot;

    try {
      snapshot = await db
        .collection(NOTIFICATIONS_COLLECTION)
        .orderBy("createdAt", "desc")
        .get();
    } catch {
      snapshot = await db.collection(NOTIFICATIONS_COLLECTION).get();
    }

    let notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as NotificationRecord),
    }));

    // filter admin booking notifications
    notifications = notifications.filter(
      (n) => !isAdminBookingNotification(n)
    );

    // filter unread
    if (unreadOnly) {
      notifications = notifications.filter((n) => n.read === false);
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/* ---------------- PUT ---------------- */
/* Update notification */

export async function PUT(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const data = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await db.collection(NOTIFICATIONS_COLLECTION).doc(id).update({
      ...data,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating notification:", error);

    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}

/* ---------------- PATCH ---------------- */
/* Mark as read */

export async function PATCH(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await db.collection(NOTIFICATIONS_COLLECTION).doc(id).update({
      read: true,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);

    return NextResponse.json(
      { error: error.message || "Failed to mark as read" },
      { status: 500 }
    );
  }
}

/* ---------------- DELETE ---------------- */

export async function DELETE(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await db.collection(NOTIFICATIONS_COLLECTION).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting notification:", error);

    return NextResponse.json(
      { error: error.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}