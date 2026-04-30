import nodemailer from 'nodemailer';

// Ensure environment variables are loaded if running in standalone mode
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2' as const,
  },
  requireTLS: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
};

console.log(`📬 SMTP Config: host=${smtpConfig.host}, port=${smtpConfig.port}, user=${smtpConfig.auth.user}, passSet=${!!smtpConfig.auth.pass}`);

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Helper to get the base application URL
 * Priority: APP_URL > NEXT_PUBLIC_APP_URL > Fallback
 */
const getAppUrl = () => {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    console.warn('⚠️ APP_URL is not defined in environment variables. Defaulting to hrms.thefoundrys.com');
    return 'https://hrms.thefoundrys.com';
  }
  return url.replace(/\/$/, ''); // Remove trailing slash if any
};

export async function sendVerificationEmail(email: string, name: string, token: string, tenantName: string = 'HR Portal') {
  const baseUrl = getAppUrl();
  const verifyUrl = `${baseUrl}/api/verify?token=${token}`;

  console.log(`📧 Sending verification email to: ${email} | BaseURL: ${baseUrl}`);

  const mailOptions = {
    from: `"${tenantName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Action Required: Verify Your Account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2980b9;">Welcome to ${tenantName}, ${name}!</h2>
        <p>An account has been prepared for you. To activate your access, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2980b9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #666; font-size: 13px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">If you didn't expect this email, please ignore it.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent! MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

export async function sendResetPasswordEmail(email: string, name: string, token: string, tenantName: string = 'HR Portal') {
  const baseUrl = getAppUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  console.log(`📧 Sending password reset email to: ${email} | BaseURL: ${baseUrl}`);

  const mailOptions = {
    from: `"${tenantName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Security: Reset Your HR Portal Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e74c3c;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset the password for your HR Portal account. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset My Password</a>
        </div>
        <p style="color: #666; font-size: 13px;">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">${tenantName} • Institutional Security Department</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent! MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}

export async function sendOnboardingInvite(email: string, name: string, tempPassword: string, token: string, tenantName: string = 'HR Portal') {
  const baseUrl = getAppUrl();
  const verifyUrl = `${baseUrl}/api/verify?token=${token}`;

  console.log(`📧 Sending onboarding invite to: ${email} | BaseURL: ${baseUrl}`);

  const mailOptions = {
    from: `"${tenantName}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Welcome to ${tenantName}! Important Login Information`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 16px; color: #1c1e21;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">Welcome to the Team, ${name}!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
          We share your excitement as you join ${tenantName}. Your HR Portal account is ready for you to access your dashboard, attendance, and payroll information.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Your Temporary Credentials</h3>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0; font-size: 15px;"><strong>Temp Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
        </div>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyUrl}" style="padding: 14px 32px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block;">Verify & Set Your Password</a>
        </div>

        <p style="font-size: 14px; line-height: 1.5; color: #6b7280; font-style: italic;">
          <strong>Security:</strong> Clicking the link above will verify your account and allow you to set your own private password.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
          ${tenantName} HR System &bull; Institutional Administration<br/>
          This is an automated message, please do not reply.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Onboarding email sent! MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send onboarding email to ${email}:`, error);
    throw error;
  }
}
