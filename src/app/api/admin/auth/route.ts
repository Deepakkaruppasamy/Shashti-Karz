import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// In production, store this in environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { error: "Password is required" },
                { status: 400 }
            );
        }

        // Verify password
        if (password === ADMIN_PASSWORD) {
            // Create a session token (in production, use a more secure token)
            const sessionToken = Buffer.from(
                `${Date.now()}-${Math.random()}`
            ).toString("base64");

            // Set cookie with session token
            const cookieStore = await cookies();
            cookieStore.set("admin_session", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/",
            });

            return NextResponse.json(
                { success: true, message: "Authentication successful" },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Admin auth error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Logout endpoint
export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("admin_session");

        return NextResponse.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Admin logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
