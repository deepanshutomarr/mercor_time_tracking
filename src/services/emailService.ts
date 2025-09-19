import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
  this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async sendEmployeeInvitation(
    email: string,
    name: string,
    activationToken: string
  ): Promise<boolean> {
    try {
      const activationUrl = `${config.webAppUrl}/activate?token=${activationToken}`;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Welcome to Mercor Time Tracking - Activate Your Account',
        html: this.getInvitationEmailTemplate(name, activationUrl),
        text: this.getInvitationEmailText(name, activationUrl)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Employee invitation email sent successfully', { email, name });
      return true;
    } catch (error) {
      logger.error('Failed to send employee invitation email:', error);
      return false;
    }
  }

  async sendPasswordReset(
    email: string,
    name: string,
    resetToken: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${config.webAppUrl}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Reset Your Password - Mercor Time Tracking',
        html: this.getPasswordResetEmailTemplate(name, resetUrl),
        text: this.getPasswordResetEmailText(name, resetUrl)
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { email, name });
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      return false;
    }
  }

  async sendTimeTrackingNotification(
    email: string,
    name: string,
    type: 'start' | 'stop' | 'reminder',
    data?: any
  ): Promise<boolean> {
    try {
      let subject: string;
      let html: string;
      let text: string;

      switch (type) {
        case 'start':
          subject = 'Time Tracking Started - Mercor Time Tracking';
          html = this.getTimeTrackingStartTemplate(name, data);
          text = this.getTimeTrackingStartText(name, data);
          break;
        case 'stop':
          subject = 'Time Tracking Stopped - Mercor Time Tracking';
          html = this.getTimeTrackingStopTemplate(name, data);
          text = this.getTimeTrackingStopText(name, data);
          break;
        case 'reminder':
          subject = 'Time Tracking Reminder - Mercor Time Tracking';
          html = this.getTimeTrackingReminderTemplate(name, data);
          text = this.getTimeTrackingReminderText(name, data);
          break;
        default:
          throw new Error('Invalid notification type');
      }

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject,
        html,
        text
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Time tracking notification email sent successfully', { email, name, type });
      return true;
    } catch (error) {
      logger.error('Failed to send time tracking notification email:', error);
      return false;
    }
  }

  private getInvitationEmailTemplate(name: string, activationUrl: string): string {
  const email = arguments[2] || '';
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Mercor Time Tracking</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mercor Time Tracking!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>You've been invited to join our time tracking platform. To get started, please activate your account by clicking the button below:</p>
            <a href="${activationUrl}" class="button">Activate Account</a>
            <p>Once activated, you'll be able to:</p>
            <ul>
              <li>Download the desktop application for time tracking</li>
              <li>View your assigned projects and tasks</li>
              <li>Track your work hours with automatic screenshots</li>
              <li>Generate detailed time reports</li>
            </ul>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The Mercor Team</p>
          </div>
          <div class="footer">
          <p>This email was sent to ${email}. If you didn't request this invitation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getInvitationEmailText(name: string, activationUrl: string): string {
  const email = arguments[2] || '';
  return `
      Welcome to Mercor Time Tracking!
      
      Hello ${name},
      
      You've been invited to join our time tracking platform. To get started, please activate your account by visiting the following link:
      
      ${activationUrl}
      
      Once activated, you'll be able to:
      - Download the desktop application for time tracking
      - View your assigned projects and tasks
      - Track your work hours with automatic screenshots
      - Generate detailed time reports
      
      If you have any questions, please don't hesitate to contact our support team.
      
      Best regards,
      The Mercor Team
      
    This email was sent to ${email}. If you didn't request this invitation, please ignore this email.
  `;
  }

  private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
  const email = arguments[2] || '';
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Mercor Time Tracking</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Mercor Time Tracking account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The Mercor Team</p>
          </div>
          <div class="footer">
          <p>This email was sent to ${email}. If you didn't request this password reset, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(name: string, resetUrl: string): string {
  const email = arguments[2] || '';
  return `
      Reset Your Password - Mercor Time Tracking
      
      Hello ${name},
      
      We received a request to reset your password for your Mercor Time Tracking account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      Best regards,
      The Mercor Team
      
    This email was sent to ${email}. If you didn't request this password reset, please ignore this email.
  `;
  }

  private getTimeTrackingStartTemplate(name: string, data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Tracking Started</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Time Tracking Started</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your time tracking session has started successfully.</p>
            <div class="info">
              <p><strong>Project:</strong> ${data.projectName || 'N/A'}</p>
              <p><strong>Task:</strong> ${data.taskName || 'N/A'}</p>
              <p><strong>Started at:</strong> ${new Date(data.startTime).toLocaleString()}</p>
            </div>
            <p>You can stop tracking anytime from your desktop application.</p>
            <p>Best regards,<br>The Mercor Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTimeTrackingStartText(name: string, data: any): string {
    return `
      Time Tracking Started - Mercor Time Tracking
      
      Hello ${name},
      
      Your time tracking session has started successfully.
      
      Project: ${data.projectName || 'N/A'}
      Task: ${data.taskName || 'N/A'}
      Started at: ${new Date(data.startTime).toLocaleString()}
      
      You can stop tracking anytime from your desktop application.
      
      Best regards,
      The Mercor Team
    `;
  }

  private getTimeTrackingStopTemplate(name: string, data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Tracking Stopped</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Time Tracking Stopped</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your time tracking session has been stopped.</p>
            <div class="info">
              <p><strong>Project:</strong> ${data.projectName || 'N/A'}</p>
              <p><strong>Task:</strong> ${data.taskName || 'N/A'}</p>
              <p><strong>Duration:</strong> ${data.duration || 'N/A'}</p>
              <p><strong>Stopped at:</strong> ${new Date(data.endTime).toLocaleString()}</p>
            </div>
            <p>Thank you for using our time tracking system!</p>
            <p>Best regards,<br>The Mercor Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTimeTrackingStopText(name: string, data: any): string {
    return `
      Time Tracking Stopped - Mercor Time Tracking
      
      Hello ${name},
      
      Your time tracking session has been stopped.
      
      Project: ${data.projectName || 'N/A'}
      Task: ${data.taskName || 'N/A'}
      Duration: ${data.duration || 'N/A'}
      Stopped at: ${new Date(data.endTime).toLocaleString()}
      
      Thank you for using our time tracking system!
      
      Best regards,
      The Mercor Team
    `;
  }

  private getTimeTrackingReminderTemplate(name: string, data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time Tracking Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Time Tracking Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>This is a friendly reminder to start your time tracking for today.</p>
            <p>Don't forget to log your work hours to ensure accurate time reporting.</p>
            <p>Best regards,<br>The Mercor Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getTimeTrackingReminderText(name: string, data: any): string {
    return `
      Time Tracking Reminder - Mercor Time Tracking
      
      Hello ${name},
      
      This is a friendly reminder to start your time tracking for today.
      
      Don't forget to log your work hours to ensure accurate time reporting.
      
      Best regards,
      The Mercor Team
    `;
  }
}

export default new EmailService();
