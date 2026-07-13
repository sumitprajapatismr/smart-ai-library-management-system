import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to a mock transporter for development if mail server is not configured
  console.warn('Warning: SMTP configurations not set. Using mock transporter (logs email to console).');
  return {
    sendMail: async (options: nodemailer.SendMailOptions) => {
      console.log('--- Mock Email Sent ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body (Text): ${options.text}`);
      console.log(`Body (HTML): ${options.html}`);
      console.log('-----------------------');
      return { messageId: 'mock-id-' + Date.now() };
    },
  } as unknown as nodemailer.Transporter;
};

export const transporter = getTransporter();

export const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Smart Library" <noreply@smartlibrary.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip tags for plain text fallback
      html,
    });
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
