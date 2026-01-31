import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
        return NextResponse.json({
            error: "Email required",
            usage: "Visit /api/fix-admin?email=your@email.com"
        }, { status: 400 });
    }

    try {
        const supabase = await createServiceClient();

        // 1. Get User ID by Email (Admin API)
        // We list users because getUser by email isn't direct in generic client sometimes, 
        // but admin.listUsers works reliably with service role.
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) throw userError;

        const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!targetUser) {
            return NextResponse.json({ error: "User not found. Please sign up first." }, { status: 404 });
        }

        const updates: string[] = [];

        // 2. Confirm Email (Fix Login Issue)
        if (!targetUser.email_confirmed_at) {
            const { error: confirmError } = await supabase.auth.admin.updateUserById(
                targetUser.id,
                { email_confirm: true }
            );
            if (confirmError) throw confirmError;
            updates.push("Email Verified");
        }

        // 3. Promote to Admin (Fix RLS/Upload Issue)
        // Update public Profile
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", targetUser.id);

        if (profileError) throw profileError;
        updates.push("Role set to 'admin'");

        return NextResponse.json({
            success: true,
            user: targetUser.email,
            updates: updates,
            message: "You can now login and access the admin dashboard."
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            hint: "Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local"
        }, { status: 500 });
    }
}
