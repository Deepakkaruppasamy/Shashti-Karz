import nodemailer from "nodemailer";

// Using Nodemailer for maximum flexibility (Gmail, Zoho, AWS SES, etc.)
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.replace(/\s/g, ""), // Remove any spaces from App Passwords
  },
  tls: {
    // Gmail often requires this to avoid AUTH errors in local/limited envs
    rejectUnauthorized: false,
    // ciphers: 'SSLv3' // SSLv3 is very old and insecure, modern SMTP might block it
  },
  pool: true, // Use pooling for better performance
  maxConnections: 5,
  maxMessages: 100,
}) : null;

// Self-test connection on init (Server-side)
if (transporter && typeof window === 'undefined') {
  console.log("[Email Engine] Initializing SMTP connection...");
  // We'll skip the verify block if it's causing slowness on cold starts, 
  // nodemailer will try to connect on first send anyway.
  // transporter.verify((error) => {
  //   if (error) {
  //     console.error("[Email Engine] Transporter connection failed:", error);
  //   } else {
  //     console.log("[Email Engine] Transporter is ready to deliver messages");
  //   }
  // });
}

const FROM_EMAIL = process.env.FROM_EMAIL || "Shashti Karz <updates@shashtikarz.app>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!transporter) {
    console.warn("[Email Engine] Transporter not initialized. Missing SMTP_HOST in environment variables.");
    return { success: true, id: "mock-email-id" };
  }

  // Create a timeout promise to prevent hanging the whole app
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Email sending timed out after 8 seconds")), 8000)
  );

  try {
    console.log(`[Email Engine] Attempting to send email to ${params.to} with subject "${params.subject}"`);
    
    // Race the email send against the timeout
    const info = await Promise.race([
      transporter.sendMail({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>?/gm, ''),
      }),
      timeoutPromise
    ]) as nodemailer.SentMessageInfo;

    console.log(`[Email Engine] Email delivered: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (err) {
    console.error("[Email Engine] Error or Timeout:", (err as Error).message);
    return { success: false, error: (err as Error).message };
  }
}

export function generateWelcomeEmail(data: { customerName: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Welcome to the Shashti Karz Community</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <h2 style="color: #d4af37; margin: 0 0 16px;">Welcome, ${data.customerName}!</h2>
      <p style="color: #aaa; margin: 0 0 24px; line-height: 1.6;">Your account has been successfully initialized. You now have access to India's most advanced car detailing platform.</p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #888; margin: 0 0 12px;">What's next?</p>
        <ul style="color: #fff; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Explore our premium detailing packages</li>
          <li style="margin-bottom: 8px;">Book your first appointment</li>
          <li style="margin-bottom: 8px;">Track your vehicle health with AI</li>
        </ul>
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/dashboard" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600;">
        Access Your Dashboard
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateLoginNotificationEmail(data: { customerName: string; time: string; ip?: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Security Alert</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <h2 style="color: #d4af37; margin: 0 0 16px;">New Login Detected</h2>
      <p style="color: #aaa; margin: 0 0 24px;">Hi ${data.customerName}, a new login was detected for your account.</p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888;">Time</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.time}</td>
          </tr>
          ${data.ip ? `
          <tr>
            <td style="padding: 8px 0; color: #888;">IP Address</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.ip}</td>
          </tr>
          ` : ""}
        </table>
      </div>
      
      <p style="color: #666; font-size: 14px; text-align: center;">
        If this wasn't you, please reset your password immediately via the Recovery Protocol on our login page.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateBookingConfirmationEmail(data: {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Car Detailing Xpert</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <h2 style="color: #d4af37; margin: 0 0 8px;">Booking Confirmed!</h2>
      <p style="color: #aaa; margin: 0 0 24px;">Hi ${data.customerName}, your booking has been confirmed.</p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888;">Service</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Date</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Time</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Booking ID</td>
            <td style="padding: 8px 0; text-align: right; color: #fff; font-family: monospace;">${data.bookingId.slice(0, 8)}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 16px 0 8px; color: #888; font-weight: bold;">Total</td>
            <td style="padding: 16px 0 8px; text-align: right; color: #d4af37; font-size: 24px; font-weight: bold;">₹${data.price.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/dashboard" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600;">
        View Booking Details
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>Questions? Reply to this email or WhatsApp us at +91 7358303550</p>
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateServiceCompletedEmail(data: {
  customerName: string;
  serviceName: string;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Car Detailing Xpert</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">✓</span>
        </div>
        <h2 style="color: #22c55e; margin: 0 0 8px;">Service Completed!</h2>
        <p style="color: #aaa; margin: 0;">Your ${data.serviceName} is ready.</p>
      </div>
      
      <p style="color: #888; text-align: center; margin-bottom: 24px;">
        Hi ${data.customerName}, your car is looking amazing! Thank you for choosing Shashti Karz.
      </p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/dashboard" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; margin-bottom: 16px;">
        View Service Details
      </a>
      
      <a href="https://g.page/r/shashti-karz/review" style="display: block; background: #1a1a1a; color: #d4af37; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; border: 1px solid #d4af37;">
        ⭐ Leave a Review
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generatePaymentReceiptEmail(data: {
  customerName: string;
  amount: number;
  serviceName: string;
  paymentId: string;
  date: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Payment Receipt</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <h2 style="color: #22c55e; margin: 0 0 8px;">Payment Received</h2>
      <p style="color: #aaa; margin: 0 0 24px;">Thank you for your payment, ${data.customerName}.</p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888;">Service</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Date</td>
            <td style="padding: 8px 0; text-align: right; color: #fff;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888;">Payment ID</td>
            <td style="padding: 8px 0; text-align: right; color: #fff; font-family: monospace;">${data.paymentId.slice(0, 12)}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 16px 0 8px; color: #888; font-weight: bold;">Amount Paid</td>
            <td style="padding: 16px 0 8px; text-align: right; color: #22c55e; font-size: 24px; font-weight: bold;">₹${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        This is your official payment receipt. Keep it for your records.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateReminderEmail(data: {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Booking Reminder</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🔔</span>
        <h2 style="color: #d4af37; margin: 16px 0 8px;">Reminder: Your Appointment</h2>
      </div>
      
      <p style="color: #aaa; text-align: center; margin-bottom: 24px;">
        Hi ${data.customerName}, just a friendly reminder about your upcoming appointment.
      </p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #888; margin: 0 0 8px;">Service</p>
        <p style="color: #fff; font-size: 20px; font-weight: bold; margin: 0 0 16px;">${data.serviceName}</p>
        <p style="color: #888; margin: 0 0 8px;">Date & Time</p>
        <p style="color: #d4af37; font-size: 20px; font-weight: bold; margin: 0;">${data.date} at ${data.time}</p>
      </div>
      
      <p style="color: #888; text-align: center; font-size: 14px;">
        Please arrive 5-10 minutes early. See you soon!
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generatePromotionalEmail(data: {
  customerName: string;
  title: string;
  message: string;
  offerCode?: string;
  discount?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 32px;">Shashti Karz</h1>
      <p style="color: #888; margin: 8px 0 0;">Special Offer</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); border-radius: 16px; padding: 4px;">
      <div style="background: #111; border-radius: 14px; padding: 32px;">
        <h2 style="color: #fff; margin: 0 0 8px; text-align: center; font-size: 28px;">${data.title}</h2>
        ${data.discount ? `<p style="color: #d4af37; font-size: 48px; font-weight: bold; text-align: center; margin: 16px 0;">${data.discount}</p>` : ""}
        <p style="color: #aaa; text-align: center; margin: 0 0 24px;">${data.message}</p>
        
        ${data.offerCode ? `
        <div style="background: #0a0a0a; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: #888; margin: 0 0 8px; font-size: 12px;">USE CODE</p>
          <p style="color: #d4af37; font-size: 24px; font-weight: bold; font-family: monospace; margin: 0; letter-spacing: 4px;">${data.offerCode}</p>
        </div>
        ` : ""}
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/booking" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600;">
          Book Now
        </a>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px; color: #666; font-size: 12px;">
      <p>Don't want promotional emails? <a href="#" style="color: #888;">Unsubscribe</a></p>
      <p>© ${new Date().getFullYear()} Shashti Karz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

export function generateAdminNewBookingEmail(data: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  carModel: string;
  date: string;
  time: string;
  price: number;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 28px;">Shashti Karz</h1>
      <p style="color: #888; margin: 6px 0 0; font-size: 13px;">Admin Notification</p>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 28px; border: 1px solid #333;">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 14px; height: 14px; background: #ff1744; border-radius: 50%; margin-right: 10px;"></div>
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🆕 New Booking Received</h2>
      </div>

      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <p style="color: #d4af37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 14px;">Booking Details</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Booking ID</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 14px;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Service</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Vehicle</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.carModel}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Date & Time</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.date} at ${data.time}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 14px 0 7px; color: #888; font-weight: bold; font-size: 14px;">Total Amount</td>
            <td style="padding: 14px 0 7px; text-align: right; color: #d4af37; font-size: 22px; font-weight: bold;">₹${data.price.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background: #111; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 3px solid #ff1744;">
        <p style="color: #d4af37; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 14px;">Customer Info</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 14px;">Name</td>
            <td style="padding: 6px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 14px;">Email</td>
            <td style="padding: 6px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerEmail}</td>
          </tr>
          ${data.customerPhone ? `
          <tr>
            <td style="padding: 6px 0; color: #888; font-size: 14px;">Phone</td>
            <td style="padding: 6px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerPhone}</td>
          </tr>` : ""}
        </table>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/admin/bookings" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d4af37 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 15px;">
        Manage Booking in Admin Panel
      </a>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz Admin. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateAdminHighValueEmail(data: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  carModel: string;
  date: string;
  price: number;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 28px;">Shashti Karz</h1>
      <p style="color: #888; margin: 6px 0 0; font-size: 13px;">Admin Notification</p>
    </div>

    <div style="background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); border-radius: 4px; padding: 4px; margin-bottom: 2px;">
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 14px; padding: 28px;">
        <h2 style="color: #d4af37; margin: 0 0 6px; font-size: 22px;">💎 High-Value Booking Alert!</h2>
        <p style="color: #aaa; margin: 0 0 22px; font-size: 14px;">A premium booking worth ₹${data.price.toLocaleString()} has been placed.</p>

        <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 7px 0; color: #888; font-size: 14px;">Booking ID</td>
              <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 14px;">${data.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #888; font-size: 14px;">Customer</td>
              <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerName} (${data.customerEmail})</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #888; font-size: 14px;">Service</td>
              <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #888; font-size: 14px;">Vehicle</td>
              <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.carModel}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #888; font-size: 14px;">Date</td>
              <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.date}</td>
            </tr>
            <tr style="border-top: 1px solid #333;">
              <td style="padding: 14px 0 7px; color: #888; font-weight: bold; font-size: 14px;">Total Amount</td>
              <td style="padding: 14px 0 7px; text-align: right; color: #d4af37; font-size: 26px; font-weight: bold;">₹${data.price.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/admin/bookings" style="display: block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0a0a0a; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; font-weight: 700; font-size: 15px;">
          View Booking in Admin Panel
        </a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz Admin. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateAdminServiceCompletedEmail(data: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  carModel: string;
  bookingId: string;
  price: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 28px;">Shashti Karz</h1>
      <p style="color: #888; margin: 6px 0 0; font-size: 13px;">Admin Notification</p>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 28px; border: 1px solid #22c55e44;">
      <h2 style="color: #22c55e; margin: 0 0 6px; font-size: 20px;">✅ Service Marked as Completed</h2>
      <p style="color: #aaa; margin: 0 0 22px; font-size: 14px;">A service has been successfully completed and the customer has been notified.</p>

      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Booking ID</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 14px;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Email</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Service</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Vehicle</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.carModel}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 14px 0 7px; color: #888; font-weight: bold; font-size: 14px;">Revenue</td>
            <td style="padding: 14px 0 7px; text-align: right; color: #22c55e; font-size: 22px; font-weight: bold;">₹${data.price.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/admin/bookings" style="display: block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 15px;">
        View in Admin Panel
      </a>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz Admin. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateAdminBookingCancelledEmail(data: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  carModel: string;
  date: string;
  price: number;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 28px;">Shashti Karz</h1>
      <p style="color: #888; margin: 6px 0 0; font-size: 13px;">Admin Notification</p>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 28px; border: 1px solid #ff174444;">
      <h2 style="color: #ff1744; margin: 0 0 6px; font-size: 20px;">❌ Booking Cancelled</h2>
      <p style="color: #aaa; margin: 0 0 22px; font-size: 14px;">A customer has cancelled their booking. The slot is now available.</p>

      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Booking ID</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 14px;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Email</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Service</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Vehicle</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.carModel}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Scheduled Date</td>
            <td style="padding: 7px 0; text-align: right; color: #ff1744; font-size: 14px;">${data.date}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 14px 0 7px; color: #888; font-weight: bold; font-size: 14px;">Lost Revenue</td>
            <td style="padding: 14px 0 7px; text-align: right; color: #ff1744; font-size: 22px; font-weight: bold;">₹${data.price.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/admin/bookings" style="display: block; background: linear-gradient(135deg, #ff1744 0%, #d50032 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 15px;">
        View in Admin Panel
      </a>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz Admin. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generateAdminPaymentReceivedEmail(data: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  amount: number;
  paymentId: string;
  bookingId: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ff1744; margin: 0; font-size: 28px;">Shashti Karz</h1>
      <p style="color: #888; margin: 6px 0 0; font-size: 13px;">Admin Notification</p>
    </div>

    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #111 100%); border-radius: 16px; padding: 28px; border: 1px solid #22c55e44;">
      <h2 style="color: #22c55e; margin: 0 0 6px; font-size: 20px;">💰 Payment Received</h2>
      <p style="color: #aaa; margin: 0 0 22px; font-size: 14px;">A customer has successfully completed their payment via Stripe.</p>

      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Booking ID</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 14px;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Payment ID</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-family: monospace; font-size: 13px;">${data.paymentId.slice(0, 20)}...</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Email</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #888; font-size: 14px;">Service</td>
            <td style="padding: 7px 0; text-align: right; color: #fff; font-size: 14px;">${data.serviceName}</td>
          </tr>
          <tr style="border-top: 1px solid #333;">
            <td style="padding: 14px 0 7px; color: #888; font-weight: bold; font-size: 14px;">Amount Received</td>
            <td style="padding: 14px 0 7px; text-align: right; color: #22c55e; font-size: 26px; font-weight: bold;">₹${data.amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://shashtikarz.app"}/admin/bookings" style="display: block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 15px;">
        View in Admin Panel
      </a>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Shashti Karz Admin. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
