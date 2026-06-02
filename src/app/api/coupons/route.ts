import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");

        if (code) {
            const { data, error } = await supabase
                .from("coupons")
                .select("*")
                .eq("code", code)
                .eq("active", true)
                .single();

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 404 });
            }

            return NextResponse.json({ coupon: data });
        }

        const { data, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ coupons: data });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { error: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { code, amount, service_ids } = body;

        const { data, error } = await supabase.rpc("validate_coupon", {
            coupon_code: code,
            user_id_param: user.id,
            booking_amount: amount,
            service_ids_param: service_ids || null,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error validating coupon:", error);
        return NextResponse.json(
            { error: "Failed to validate coupon" },
            { status: 500 }
        );
    }
}
