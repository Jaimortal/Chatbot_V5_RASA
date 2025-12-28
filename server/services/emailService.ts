import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Simple in-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; email: string; expires: number }>();

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
function createTransporter() {
  // Debug: Log environment variables (without exposing passwords)
  console.log("SMTP Configuration:");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS defined:", !!process.env.SMTP_PASS);
  console.log("SMTP_FROM:", process.env.SMTP_FROM);
  
  // for development, use ethereal email or test account
  // in production, configure with real SMTP settings
  return nodemailer.createTransport({  // Fixed: createTransport not createTransporter
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password',
    },
  });
}

// send verification code email
export async function sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Starting email send process to:", email);
    
    const code = generateVerificationCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // store the code
    verificationCodes.set(email, { code, email, expires });
    
    // create transporter
    console.log("Creating email transporter...");
    const transporter = createTransporter();
    
    // berify transporter configuration
    console.log("Verifying transporter...");
    await transporter.verify();
    console.log("Transporter verified successfully");
    
    // email content
    const mailOptions = {
      from: process.env.SMTP_FROM || '"BukSU Chatbot" <noreply@yourdomain.com>',
      to: email,
      subject: 'Email Verification Code - BukSU Chatbot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #001C38; color: white; padding: 20px; text-align: center;">
            <h1>BukSU Chatbot</h1>
            <p>Email Verification</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to change your email address. Please use the verification code below to complete the process:
            </p>
            <div style="background: white; border: 2px solid #001C38; padding: 20px; margin: 20px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; color: #001C38; letter-spacing: 5px;">${code}</span>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This code will expire in <strong>10 minutes</strong>. If you didn't request this change, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding: 15px; background: #ffffffff; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #fcfcfcff;">
                <strong>Security Note:</strong> Never share this code with anyone. Chatbot staff will never ask for your verification code.
              </p>
            </div>
          </div>
          <div style="background: #001C38; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">
              © 2025 Chatbot. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };
    
    // send email
    console.log("Sending email...");
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    
    return { 
      success: true, 
      message: 'Verification code sent successfully. Please check your email.' 
    };
    
  } catch (error) {
    console.error("Detailed error sending verification code:", error);
    
    // Type assertion for error handling
    const err = error as any;
    
    // Specific error handling
    if (err.code === 'EAUTH') {
      return { 
        success: false, 
        message: 'Authentication failed. Please check your SMTP credentials.' 
      };
    } else if (err.code === 'ECONNECTION') {
      return { 
        success: false, 
        message: 'Connection failed. Please check your SMTP settings.' 
      };
    } else if (err.code === 'ESOCKET') {
      return { 
        success: false, 
        message: 'Socket error. Please check your firewall and SMTP port.' 
      };
    } else {
      return { 
        success: false, 
        message: `Failed to send verification code: ${err.message || 'Unknown error'}` 
      };
    }
  }
}

// Verify code
export function verifyCode(email: string, code: string): { success: boolean; message: string } {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    return { success: false, message: 'No verification code found for this email.' };
  }
  
  if (Date.now() > stored.expires) {
    verificationCodes.delete(email);
    return { success: false, message: 'Verification code has expired.' };
  }
  
  if (stored.code !== code) {
    return { success: false, message: 'Invalid verification code.' };
  }
  
  // Code is valid, remove it
  verificationCodes.delete(email);
  return { success: true, message: 'Code verified successfully.' };
}

// Clean up expired codes (run periodically)
export function cleanupExpiredCodes(): void {
  const now = Date.now();
  verificationCodes.forEach((data, email) => {
    if (now > data.expires) {
      verificationCodes.delete(email);
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);
