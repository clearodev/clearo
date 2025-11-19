import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create transporter - supports both SMTP and development mode
const createTransporter = () => {
  // For development, use ethereal.email or console logging
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    // In development without SMTP, we'll use a test account or console
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'test',
      },
    });
  }

  // Production SMTP configuration
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️  SMTP credentials not configured. Email functionality will not work.');
    // Return a dummy transporter that will fail gracefully
    return nodemailer.createTransport({
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: 'dummy',
        pass: 'dummy',
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const transporter = createTransporter();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3002';
const APP_NAME = process.env.APP_NAME || 'Clearo';

export const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  try {
    const from = process.env.SMTP_FROM || process.env.RESEND_FROM || process.env.SMTP_USER || 'noreply@clearo.com';

    // Use Resend API if API key is configured (more reliable than SMTP)
    if (resend && process.env.RESEND_API_KEY) {
      try {
        console.log(`📧 Attempting to send email via Resend API...`);
        console.log(`   To: ${to}`);
        console.log(`   From: ${from}`);
        console.log(`   Subject: ${subject}`);
        
        const result = await resend.emails.send({
          from: from.includes('<') ? from : `${APP_NAME} <${from}>`,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''),
        });

        // Log full result for debugging
        console.log('📦 Resend API Full Response:', JSON.stringify(result, null, 2));
        
        // Check for errors in response first
        if (result.error) {
          console.error('❌ Resend API returned an error in response:', result.error);
          throw new Error(result.error.message || 'Resend API error');
        }
        
        // Extract email ID safely
        const emailId = (result.data && 'id' in result.data) ? result.data.id : 
                       ('id' in result ? result.id : 'unknown');
        
        console.log(`✅ Email sent via Resend API to ${to} (ID: ${emailId})`);
        return result;
      } catch (resendError: any) {
        console.error('❌ Resend API error details:');
        console.error('   Error object:', resendError);
        console.error('   Error message:', resendError.message);
        console.error('   Error response:', resendError.response?.data || resendError.response);
        console.error('   Error status:', resendError.status || resendError.statusCode);
        
        // Provide helpful error messages for Resend
        const errorMessage = resendError.message || resendError.response?.data?.message || '';
        if (errorMessage.includes('not verified') || 
            errorMessage.includes('domain') ||
            errorMessage.includes('unauthorized') ||
            resendError.status === 403) {
          console.error('\n❌ Resend Verification/Authorization Error:');
          console.error('   The FROM email address must be verified in Resend.');
          console.error('   Error:', errorMessage);
          console.error('\n💡 Solutions:');
          console.error('   1. Go to Resend Dashboard: https://resend.com/domains');
          console.error('   2. Verify your domain or email address');
          console.error('   3. Update RESEND_FROM in .env to use verified email');
          console.error('   4. For testing, use: onboarding@resend.dev (pre-verified)');
          console.error('   5. Check your RESEND_API_KEY is correct\n');
        }
        throw resendError;
      }
    }

    // Fall back to SMTP (nodemailer)
    const mailOptions = {
      from: `"${APP_NAME}" <${from}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the preview URL for ethereal emails
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL: %s', previewUrl);
      }
    }

    return info;
  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // Provide helpful error messages for common issues
    if (error.responseCode === 554 && error.response?.includes('not verified')) {
      const message = error.response || error.message || '';
      console.error('\n❌ Email Verification Error:');
      console.error('   Email addresses must be verified.');
      console.error('   Error:', message);
      console.error('\n💡 Solutions:');
      if (process.env.SMTP_HOST?.includes('resend')) {
        console.error('   Using Resend - verify your domain/email at: https://resend.com/domains');
        console.error('   Or use: onboarding@resend.dev for testing');
      } else if (process.env.SMTP_HOST?.includes('amazonaws')) {
        console.error('   Using AWS SES - verify in AWS Console');
      } else {
        console.error('   Check your email provider\'s verification requirements');
      }
      console.error('');
    }
    
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to ${APP_NAME}!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, `Verify your ${APP_NAME} email`, html);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px;">You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(email, `Reset your ${APP_NAME} password`, html);
};

