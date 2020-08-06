import dotenv from 'dotenv';
dotenv.config();

export default {
  token: 'secretKey',
  host: 'localhost',
  forumUrl: process.env.FORUM_URL || 'http://localhost/',
  port: {
    http: 3000,
    ws: 3000,
  },
  mailer: {
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: '',
    },
    tls: {
      rejectUnauthorized: true,
    },
  },
  emailTo: [''],
};
