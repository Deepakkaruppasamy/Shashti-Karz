import { NextRequest, NextResponse } from "next/server";

/**
 * Send Email Notification API
 * Sends automated emails for support requests and feedback
 */

interface EmailPayload {
    to: string;
    subject: string;
    type: "support_request" | "support_update" | "feedback_confirmation";
    data: {
        customerName: string;
        requestId?: string;
        subject?: string;
        category?: string;
        priority?: string;
        status?: string;
        message?: string;
        feedbackType?: string;
        rating?: number;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: EmailPayload = await request.json();
        const { to, subject, type, data } = body;

        // Generate email HTML based on type
        const htmlContent = generateEmailHTML(type, data);

        // In production, integrate with your email service (SendGrid, Resend, etc.)
        // For now, we'll log the email content
        console.log("=== EMAIL NOTIFICATION ===");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("Type:", type);
        console.log("Content:", htmlContent);
        console.log("========================");

        // TODO: Replace with actual email service integration
        /*
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Shashti Karz <noreply@shashtikarz.com>",
            to,
            subject,
            html: htmlContent,
          }),
        });
        */

        return NextResponse.json({
            success: true,
            message: "Email notification sent successfully",
            // Include email preview in development
            preview: process.env.NODE_ENV === "development" ? htmlContent : undefined
        });

    } catch (error) {
        console.error("Email notification error:", error);
        return NextResponse.json(
            { error: "Failed to send email notification" },
            { status: 500 }
        );
    }
}

function generateEmailHTML(type: string, data: any): string {
    const baseStyle = `
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; }
      .footer { background: #333; color: #ccc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
      .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
      .priority-high { border-left-color: #ff1744; }
      .priority-urgent { border-left-color: #d50000; }
    </style>
  `;

    switch (type) {
        case "support_request":
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎧 Support Request Received</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>Thank you for contacting Shashti Karz support. We have received your support request and our team will respond shortly.</p>
              
              <div class="info-box ${data.priority === 'high' || data.priority === 'urgent' ? 'priority-' + data.priority : ''}">
                <strong>Request ID:</strong> #${data.requestId}<br>
                <strong>Subject:</strong> ${data.subject}<br>
                <strong>Category:</strong> ${data.category}<br>
                <strong>Priority:</strong> ${data.priority}<br>
                <strong>Your Message:</strong><br>
                <em>${data.message}</em>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your request within 24 hours</li>
                <li>For urgent issues, we'll respond within 4 hours</li>
                <li>You'll receive email updates when your request status changes</li>
                <li>You can track your request status in your dashboard</li>
              </ul>
              
              <center>
                <a href="https://www.shashtikarz.com/dashboard" class="button">View My Dashboard</a>
              </center>
              
              <p>If you have any additional information, please reply to this email.</p>
              
              <p>Best regards,<br><strong>Shashti Karz Support Team</strong></p>
            </div>
            <div class="footer">
              <p>Shashti Karz - Premium Car Detailing<br>
              📍 123 Car Care Street, Auto District, Tirupur<br>
              📞 +91 98765 43210 | 📧 support@shashtikarz.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

        case "support_update":
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📢 Support Request Update</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>Your support request has been updated!</p>
              
              <div class="info-box">
                <strong>Request ID:</strong> #${data.requestId}<br>
                <strong>New Status:</strong> <span style="color: #667eea; font-weight: bold;">${data.status?.toUpperCase()}</span><br>
                ${data.message ? `<br><strong>Admin Response:</strong><br><em>${data.message}</em>` : ''}
              </div>
              
              <center>
                <a href="https://www.shashtikarz.com/dashboard" class="button">View Full Details</a>
              </center>
              
              <p>Thank you for your patience!</p>
              
              <p>Best regards,<br><strong>Shashti Karz Support Team</strong></p>
            </div>
            <div class="footer">
              <p>Shashti Karz - Premium Car Detailing<br>
              📍 123 Car Care Street, Auto District, Tirupur<br>
              📞 +91 98765 43210 | 📧 support@shashtikarz.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

        case "feedback_confirmation":
            return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyle}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⭐ Thank You for Your Feedback!</h1>
            </div>
            <div class="content">
              <p>Dear ${data.customerName},</p>
              <p>Thank you for taking the time to share your valuable feedback with us!</p>
              
              <div class="info-box">
                <strong>Feedback Type:</strong> ${data.feedbackType}<br>
                ${data.rating ? `<strong>Rating:</strong> ${'⭐'.repeat(data.rating)}<br>` : ''}
                <br><strong>Your Feedback:</strong><br>
                <em>${data.message}</em>
              </div>
              
              <p><strong>Your input is incredibly valuable to us!</strong></p>
              <p>We take all feedback seriously and use it to continuously improve our services. Our team will review your feedback and may reach out if we need any clarification.</p>
              
              ${data.rating && data.rating >= 4 ? `
                <p style="background: #e8f5e9; padding: 15px; border-radius: 5px;">
                  🌟 We're thrilled that you had a great experience! Would you mind sharing your experience on Google Reviews? It helps us serve more customers like you!
                </p>
                <center>
                  <a href="https://g.page/r/shashtikarz/review" class="button">Leave a Google Review</a>
                </center>
              ` : ''}
              
              <p>Thank you for choosing Shashti Karz!</p>
              
              <p>Best regards,<br><strong>Shashti Karz Team</strong></p>
            </div>
            <div class="footer">
              <p>Shashti Karz - Premium Car Detailing<br>
              📍 123 Car Care Street, Auto District, Tirupur<br>
              📞 +91 98765 43210 | 📧 support@shashtikarz.com</p>
            </div>
          </div>
        </body>
        </html>
      `;

        default:
            return `<html><body><p>Email content not available</p></body></html>`;
    }
}
