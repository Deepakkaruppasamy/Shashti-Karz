import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get("to") || process.env.ADMIN_EMAIL;

    if (!to) {
        return NextResponse.json({ 
            error: "No recipient specified. Provide ?to=email@example.com or set ADMIN_EMAIL in env." 
        }, { status: 400 });
    }

    try {
        console.log(`[Test Email] Initiating test to ${to}...`);
        
        const result = await sendEmail({
            to,
            subject: "🚀 Shashti Karz - Email System Test",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; border-radius: 12px; border: 1px solid #333;">
                    <h1 style="color: #ff1744; text-align: center;">Email System: ACTIVE</h1>
                    <p style="text-align: center; color: #888;">This is a test notification from the Shashti Karz Detailing Platform.</p>
                    
                    <div style="background: #111; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37;">
                        <h3 style="color: #d4af37; margin-top: 0;">Diagnostic Info:</h3>
                        <p style="margin-bottom: 5px;"><b>Status:</b> ✅ Connection Verified</p>
                        <p style="margin-bottom: 5px;"><b>Recipient:</b> ${to}</p>
                        <p style="margin-bottom: 5px;"><b>Timestamp:</b> ${new Date().toLocaleString()}</p>
                        <p style="margin-bottom: 0;"><b>SMTP Host:</b> ${process.env.SMTP_HOST}</p>
                    </div>
                    
                    <p style="font-size: 12px; color: #555; text-align: center; margin-top: 30px;">
                        © ${new Date().getFullYear()} Shashti Karz. If you did not initiate this test, please ignore.
                    </p>
                </div>
            `
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent successfully to ${to}`,
                id: result.id
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                hint: "Check server logs for detailed error trace (tls, auth, or timeout issues)."
            }, { status: 500 });
        }
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}
