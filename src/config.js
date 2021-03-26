import dotenv from 'dotenv';
dotenv.config();

export default {
  token: process.env.TOKEN || 'secretKey',
  host: process.env.HOST || 'localhost',
  forumUrl: process.env.FORUM_URL || 'http://localhost/',
  port: {
    http: Number(process.env.HTTP_PORT) || 3000,
    ws: Number(process.env.WS_PORT) || 3000,
  },
  mailer: {
    host: process.env.MAILER_HOST || '',
    port: process.env.MAILER_PORT || 587,
    secure: process.env.MAILER_SECURE === 'true' || false,
    auth: {
      user: process.env.MAILER_AUTH_USER || '',
      pass: process.env.MAILER_AUTH_PASS || '',
    },
    tls: {
      rejectUnauthorized: process.env.MAILER_TLS_REJECT_UNAUTHORIZED === 'false' || true,
    },
  },
  emailTo: (process.env.EMAIL_TO && process.env.EMAIL_TO.split(',')) || [''],
};
