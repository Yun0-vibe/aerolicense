import { Resend } from 'resend';

let resend: Resend | null = null;

// Lazy initialization so the module can be imported at build time
// without requiring RESEND_API_KEY to be set.
function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendLicenseEmail(params: {
  to: string;
  customerName: string;
  productName: string;
  tierName: string;
  licenseKey: string;
  expiresAt: string;
}) {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: params.to,
    subject: `Your ${params.productName} License Key`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to ${params.productName}!</h1>
        <p>Hi ${params.customerName},</p>
        <p>Thank you for your purchase. Here are your license details:</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Product:</strong> ${params.productName}</p>
          <p><strong>Tier:</strong> ${params.tierName}</p>
          <p><strong>License Key:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px;">${params.licenseKey}</code></p>
          <p><strong>Expires:</strong> ${params.expiresAt}</p>
        </div>
        <p>To activate your license, enter the key in the product's license prompt.</p>
        <p>If you have any questions, contact us at support@aerovibestudio.com</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: 'Welcome to AeroVibe Studio',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome!</h1>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully.</p>
      </div>
    `,
  });
}
