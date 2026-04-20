import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "ASEC Events";
const companyEmail = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "info@asecevents.com";
const companyPhone = process.env.NEXT_PUBLIC_COMPANY_PHONE || "+1234567890";
const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "123 Event Street, City, Country";
const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL || "https://asec-web-app.web.app/pay";

interface InvoiceEmailData {
  to: string;
  customerName: string;
  invoiceNumber: string;
  eventDate: string;
  eventType: string;
  amount: number;
  guests: number;
  status: "pending" | "confirmed" | "paid";
  invoiceId?: string;
}

function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const { customerName, invoiceNumber, eventDate, eventType, amount, guests, status } = data;
  
  const statusColors = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    paid: "#10b981",
  };
  
  const statusLabels = {
    pending: "Payment Request",
    confirmed: "Booking Confirmed",
    paid: "Receipt",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
  <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e293b; margin: 0;">${companyName}</h1>
      <p style="color: #64748b; margin: 5px 0 0;">Invoice ${invoiceNumber}</p>
    </div>

    <div style="background: #f1f5f9; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColors[status]}; font-weight: bold;">${statusLabels[status]}</span></p>
      <p style="margin: 10px 0 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Customer Name</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${customerName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Event Type</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventType}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Event Date</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDate}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Expected Guests</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${guests} guests</td>
      </tr>
      <tr>
        <td style="padding: 10px; background: #f1f5f9;"><strong>Total Amount</strong></td>
        <td style="padding: 10px; background: #f1f5f9; text-align: right; font-size: 18px;"><strong>₦${amount.toLocaleString()}</strong></td>
      </tr>
    </table>

    ${status !== 'paid' ? `
    <div style="text-align: center; margin-top: 20px;">
      <a href="${paymentUrl}${invoiceNumber ? '?invoice=' + invoiceNumber : ''}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Now</a>
    </div>
    ` : ''}

    <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">${companyName}</p>
      <p style="color: #64748b; font-size: 12px; margin: 5px 0 0;">${companyEmail}</p>
      <p style="color: #64748b; font-size: 12px; margin: 5px 0 0;">${companyPhone}</p>
      <p style="color: #64748b; font-size: 12px; margin: 5px 0 0;">${companyAddress}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  try {
    const html = generateInvoiceEmailHtml(data);

    const info = await transporter.sendMail({
      from: `"${companyName}" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: `Invoice ${data.invoiceNumber} - ${companyName}`,
      html,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}${month}-${random}`;
}