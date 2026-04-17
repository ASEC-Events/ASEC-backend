import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

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

async function verifyPassword(email: string, password: string): Promise<string | null> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return null;
  }

  return data.idToken;
}

export async function POST(request: NextRequest) {
  try {
    getFirebaseApp();
    const { email, password, isRegister } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      const adminAuth = getAuth();

      if (isRegister) {
        const userRecord = await adminAuth.createUser({
          email,
          password,
        });

        const token = await adminAuth.createCustomToken(userRecord.uid);

        return NextResponse.json({
          success: true,
          token,
          user: {
            id: userRecord.uid,
            email: userRecord.email,
          },
        });
      } else {
        const idToken = await verifyPassword(email, password);

        if (!idToken) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }

        const userRecord = await adminAuth.getUserByEmail(email);
        const customToken = await adminAuth.createCustomToken(userRecord.uid);

        const response = NextResponse.json({
          success: true,
          token: customToken,
          user: {
            id: userRecord.uid,
            email: userRecord.email,
          },
        });

        response.cookies.set("auth_token", customToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }
    } catch (firebaseError: any) {
      const errorCode = firebaseError?.code || firebaseError?.message;

      if (errorCode?.includes("user-not-found") || errorCode?.includes("auth/user-not-found")) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      if (errorCode?.includes("email-already-in-use")) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      if (errorCode?.includes("wrong-password") || errorCode?.includes("invalid-credential")) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
      throw firebaseError;
    }
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}