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

const NOTIFICATIONS_COLLECTION = "notifications";

type NotificationRecord = {
  type?: unknown;
  bookingSource?: unknown;
  source?: unknown;
  data?: {
    bookingSource?: unknown;
    source?: unknown;
  } | null;
};

function isAdminBookingNotification(notification: NotificationRecord) {
  const notificationType =
    typeof notification.type === "string" ? notification.type : "";
  const notificationSource =
    notification.bookingSource ??
    notification.source ??
    notification.data?.bookingSource ??
    notification.data?.source;

  return (
    notificationType.startsWith("booking_") &&
    notificationSource === "admin"
  );
}

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

    let notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    notifications = notifications.filter(
      (notification) => !isAdminBookingNotification(notification),
    );

    if (unreadOnly) {
      notifications = notifications.filter((n: any) => n.read === false);
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

export async function PATCH(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db
      .collection(NOTIFICATIONS_COLLECTION)
      .doc(id)
      .update({ read: true, updatedAt: Date.now() });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as read" },
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
