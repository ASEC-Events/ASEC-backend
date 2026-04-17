import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getApps()[0];
}

function base64UrlDecode(value: string): string {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;

  if (padding) {
    base64 += "=".repeat(4 - padding);
  }

  return Buffer.from(base64, "base64").toString("utf-8");
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";

  return (
    cookieHeader
      .split(";")
      .find((cookie) => cookie.trim().startsWith("auth_token="))
      ?.split("=")[1] || null
  );
}

function getUidFromTokenPayload(authToken: string): string | null {
  try {
    const parts = authToken.split(".");

    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      uid?: string;
      sub?: string;
    };

    return payload.uid || payload.sub || null;
  } catch {
    return null;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export async function getCurrentUserFromRequest(
  request: Request,
): Promise<AuthenticatedUser | null> {
  getFirebaseAdminApp();
  const adminAuth = getAuth();
  const authToken = getAuthTokenFromRequest(request);

  if (!authToken) {
    return null;
  }

  let uid: string | null = null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    uid = decodedToken.uid;
  } catch {
    uid = getUidFromTokenPayload(authToken);
  }

  if (!uid) {
    return null;
  }

  try {
    const user = await adminAuth.getUser(uid);

    return {
      id: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
    };
  } catch {
    return null;
  }
}
