import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

// ── Transport setup ─────────────────────────────────────────
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  // SMTP config from env, fallback to ethereal for dev
  if (config.email.smtp.host) {
    transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
  } else if (config.isDev) {
    // Dev mode: log emails to console instead of sending
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    logger.info('📧 Email service running in DEV mode (console output)');
  } else {
    throw new Error('Email service not configured. Set SMTP_HOST or run in dev mode.');
  }

  return transporter;
}

// ── Email templates ─────────────────────────────────────────

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function gradeNotificationTemplate(params: {
  studentName: string;
  subjectName: string;
  score: number;
  maxScore: number;
  gradeType: string;
  comment?: string | null;
  teacherName: string;
  date: string;
  appName: string;
}): EmailTemplate {
  const percentage = Math.round((params.score / params.maxScore) * 100);
  const gradeColor = percentage >= 90 ? '#16a34a' : percentage >= 70 ? '#2563eb' : percentage >= 50 ? '#ca8a04' : '#dc2626';

  return {
    subject: `📚 New grade in ${params.subjectName}: ${params.score}/${params.maxScore}`,
    text: `${params.studentName} received a new grade in ${params.subjectName}: ${params.score}/${params.maxScore} (${percentage}%). Type: ${params.gradeType}. Teacher: ${params.teacherName}. Date: ${params.date}. Comment: ${params.comment || 'None'}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #1e293b; margin: 0 0 8px;">📚 New Grade</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">${params.appName} · Grade Notification</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Student</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.studentName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Subject</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.subjectName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Type</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.gradeType}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Date</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.date}</td>
            </tr>
          </table>

          <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
            <p style="font-size: 48px; font-weight: 800; color: ${gradeColor}; margin: 0;">${params.score}<span style="font-size: 24px; color: #94a3b8;">/${params.maxScore}</span></p>
            <p style="font-size: 18px; font-weight: 600; color: ${gradeColor}; margin: 4px 0 0;">${percentage}%</p>
          </div>

          ${params.comment ? `<div style="padding: 16px; background: #fef3c7; border-radius: 8px; margin-bottom: 16px;"><p style="font-size: 13px; color: #92400e; margin: 0;">💬 <strong>Teacher comment:</strong> ${params.comment}</p></div>` : ''}

          <p style="font-size: 13px; color: #94a3b8; margin: 16px 0 0;">Teacher: ${params.teacherName}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ${params.appName}. Please do not reply to this email.</p>
        </div>
      </div>
    `,
  };
}

function attendanceNotificationTemplate(params: {
  studentName: string;
  className: string;
  subjectName?: string;
  status: string;
  date: string;
  note?: string | null;
  appName: string;
}): EmailTemplate {
  const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
    PRESENT: { icon: '✅', color: '#16a34a', label: 'Present' },
    ABSENT: { icon: '❌', color: '#dc2626', label: 'Absent' },
    LATE: { icon: '⏰', color: '#ca8a04', label: 'Late' },
    EXCUSED: { icon: '📋', color: '#2563eb', label: 'Excused' },
    EARLY_LEAVE: { icon: '🚪', color: '#ea580c', label: 'Early Leave' },
  };
  const cfg = statusConfig[params.status] || statusConfig.PRESENT;

  return {
    subject: `${cfg.icon} Attendance update: ${params.studentName} — ${cfg.label}`,
    text: `${params.studentName} was marked as ${cfg.label} on ${params.date} in ${params.className}${params.subjectName ? ` (${params.subjectName})` : ''}. Note: ${params.note || 'None'}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #1e293b; margin: 0 0 8px;">${cfg.icon} Attendance Update</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">${params.appName} · Attendance Notification</p>

          <div style="text-align: center; padding: 24px; background: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
            <p style="font-size: 28px; font-weight: 800; color: ${cfg.color}; margin: 0;">${cfg.label}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Student</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.studentName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Class</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.className}</td>
            </tr>
            ${params.subjectName ? `<tr><td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Subject</td><td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.subjectName}</td></tr>` : ''}
            <tr>
              <td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Date</td>
              <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.date}</td>
            </tr>
          </table>

          ${params.note ? `<div style="padding: 16px; background: #fef3c7; border-radius: 8px; margin-top: 16px;"><p style="font-size: 13px; color: #92400e; margin: 0;">📝 <strong>Note:</strong> ${params.note}</p></div>` : ''}

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification from ${params.appName}.</p>
        </div>
      </div>
    `,
  };
}

function homeworkNotificationTemplate(params: {
  studentName: string;
  homeworkTitle: string;
  subjectName: string;
  dueDate: string;
  className: string;
  appName: string;
}): EmailTemplate {
  return {
    subject: `📝 New homework: ${params.homeworkTitle}`,
    text: `${params.studentName} has new homework in ${params.subjectName}: "${params.homeworkTitle}". Due: ${params.dueDate}. Class: ${params.className}.`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #1e293b; margin: 0 0 8px;">📝 New Homework Assignment</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">${params.appName}</p>
          <h2 style="font-size: 20px; color: #1e293b; margin: 0 0 16px;">${params.homeworkTitle}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Student</td><td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.studentName}</td></tr>
            <tr><td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Subject</td><td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.subjectName}</td></tr>
            <tr><td style="padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 14px; color: #64748b;">Class</td><td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${params.className}</td></tr>
            <tr><td style="padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 14px; color: #92400e;">⏰ Due Date</td><td style="padding: 12px; font-size: 14px; color: #92400e; font-weight: 700;">${params.dueDate}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">${params.appName}</p>
        </div>
      </div>
    `,
  };
}

// ── Email Service ──────────────────────────────────────────

export class EmailService {
  /**
   * Send an email to a single recipient
   */
  static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const transport = getTransporter();

      const info = await transport.sendMail({
        from: config.email.from,
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(`📧 Email sent to ${to}: "${template.subject}" (id: ${info.messageId})`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Notify parent/guardian about a new grade
   */
  static async notifyGradeCreated(params: {
    studentId: string;
    studentName: string;
    parentEmail?: string;
    subjectName: string;
    score: number;
    maxScore: number;
    gradeType: string;
    comment?: string | null;
    teacherName: string;
  }) {
    // Always create in-app notification
    const { NotificationService } = await import('../modules/notifications/notifications.service');

    // Find student's user ID
    const prisma = (await import('../config/prisma')).default;
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      select: { userId: true },
    });

    if (student) {
      await NotificationService.create({
        userId: student.userId,
        type: 'GENERAL',
        title: `📚 New grade in ${params.subjectName}`,
        content: `You received ${params.score}/${params.maxScore} (${Math.round(params.score / params.maxScore * 100)}%) in ${params.subjectName}`,
        data: { score: params.score, maxScore: params.maxScore, subject: params.subjectName },
        link: '/my-grades',
      });
    }

    // Send email if parent email available
    if (params.parentEmail) {
      const template = gradeNotificationTemplate({
        ...params,
        date: new Date().toLocaleDateString(),
        appName: 'EduPlatform',
      });
      return this.sendEmail(params.parentEmail, template);
    }

    return false;
  }

  /**
   * Notify parent/guardian about attendance update
   */
  static async notifyAttendanceUpdate(params: {
    studentId: string;
    studentName: string;
    parentEmail?: string;
    className: string;
    subjectName?: string;
    status: string;
    note?: string | null;
  }) {
    const { NotificationService } = await import('../modules/notifications/notifications.service');

    const prisma = (await import('../config/prisma')).default;
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      select: { userId: true },
    });

    if (student) {
      const statusLabels: Record<string, string> = {
        PRESENT: '✅ Present',
        ABSENT: '❌ Absent',
        LATE: '⏰ Late',
        EXCUSED: '📋 Excused',
        EARLY_LEAVE: '🚪 Early Leave',
      };

      await NotificationService.create({
        userId: student.userId,
        type: 'GENERAL',
        title: `Attendance: ${statusLabels[params.status] || params.status}`,
        content: `Marked as ${params.status} in ${params.className}${params.subjectName ? ` (${params.subjectName})` : ''}`,
        data: { status: params.status, className: params.className },
        link: '/my-grades',
      });
    }

    if (params.parentEmail) {
      const template = attendanceNotificationTemplate({
        ...params,
        date: new Date().toLocaleDateString(),
        appName: 'EduPlatform',
      });
      return this.sendEmail(params.parentEmail, template);
    }

    return false;
  }

  /**
   * Notify about new homework assignment
   */
  static async notifyHomeworkAssigned(params: {
    studentId: string;
    studentName: string;
    parentEmail?: string;
    homeworkTitle: string;
    subjectName: string;
    className: string;
    dueDate: string;
  }) {
    const { NotificationService } = await import('../modules/notifications/notifications.service');

    const prisma = (await import('../config/prisma')).default;
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      select: { userId: true },
    });

    if (student) {
      await NotificationService.create({
        userId: student.userId,
        type: 'HOMEWORK',
        title: `📝 New homework: ${params.homeworkTitle}`,
        content: `${params.subjectName} — due ${params.dueDate}`,
        data: { homeworkTitle: params.homeworkTitle, subject: params.subjectName },
        link: '/homework',
      });
    }

    if (params.parentEmail) {
      const template = homeworkNotificationTemplate({
        ...params,
        appName: 'EduPlatform',
      });
      return this.sendEmail(params.parentEmail, template);
    }

    return false;
  }

  /**
   * Test email connectivity
   */
  static async testConnection(): Promise<{ connected: boolean; mode: string }> {
    try {
      const transport = getTransporter();
      await transport.verify();
      return { connected: true, mode: config.email.smtp.host ? 'smtp' : 'dev' };
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return { connected: false, mode: 'error' };
    }
  }
}
