import { NextResponse } from "next/server";
import {
  getAuthTokenFromRequest,
  getCurrentUserFromRequest,
} from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const authToken = getAuthTokenFromRequest(request);

    if (!authToken) {
      return NextResponse.json(
        { error: "No auth token" },
        { status: 401 }
      );
    }

    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user" },
      { status: 500 }
    );
  }
}
