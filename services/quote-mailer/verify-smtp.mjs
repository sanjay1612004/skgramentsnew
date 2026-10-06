import nodemailer from 'nodemailer';

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, '');
if (!user || !pass) {
  console.error('Set SMTP_USER and SMTP_APP_PASSWORD in services/quote-mailer/.env first.');
  process.exitCode = 1;
} else {
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 });
  try {
    await transport.verify();
    console.log('Gmail connection verified. No email was sent.');
  } catch (error) {
    console.error(`Gmail connection could not be verified (${error.code || 'SMTP_ERROR'}). Check the App Password and two-step verification.`);
    process.exitCode = 1;
  } finally { transport.close(); }
}
