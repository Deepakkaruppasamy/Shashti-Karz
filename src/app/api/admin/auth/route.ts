import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

        if (password === ADMIN_PASSWORD) {
            const sessionToken = Buffer.from(
                `${Date.now()}-${Math.random()}`
            ).toString("base64");

            const cookieStore = await cookies();
            cookieStore.set("admin_session", sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24,
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
