import { sendEmail, generateWelcomeEmail, generateLoginNotificationEmail } from "@/lib/email-service";

export async function sendAuthNotification(params: {
    type: "signup" | "login";
    email: string;
    name: string;
    time?: string;
    ip?: string;
}) {
    const { type, email, name, time, ip } = params;

    if (type === "signup") {
        const html = generateWelcomeEmail({ customerName: name });
        return await sendEmail({
            to: email,
            subject: "Welcome to Shashti Karz!",
            html,
        });
    } else if (type === "login") {
        const html = generateLoginNotificationEmail({
            customerName: name,
            time: time || new Date().toLocaleString(),
            ip,
        });
        return await sendEmail({
            to: email,
            subject: "New Login Detected - Shashti Karz",
            html,
        });
    }

    return { success: false, error: "Invalid notification type" };
}
