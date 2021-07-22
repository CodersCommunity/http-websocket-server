import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

export const sslConfig = getSslConfig();

export default {
  token: process.env.SECRET_TOKEN || 'secretToken',
  protocol: process.env.PROTOCOL || 'http',
  host: process.env.HOST || 'localhost',
  port: {
    http: Number(process.env.HTTP_PORT) || 3000,
    ws: Number(process.env.WS_PORT) || 3000,
    q2a: Number(process.env.Q2A_PORT) || 80,
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
      rejectUnauthorized: process.env.MAILER_TLS_REJECT_UNAUTHORIZED === 'true' || false,
    },
  },
  emailTo: (process.env.EMAIL_TO && process.env.EMAIL_TO.split(',').map((email) => email.trim())) || [''],
};

function getSslConfig() {
  const PROTOCOL = process.env.PROTOCOL;
  const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
  const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

  let key = '';
  let cert = '';

  if (PROTOCOL === 'https') {
    const isSslConfigSpecified = SSL_KEY_PATH && SSL_CERT_PATH;

    let sslKeyPath = SSL_KEY_PATH;
    let sslCertPath = SSL_CERT_PATH;

    if (!isSslConfigSpecified) {
      console.warn('SSL config not provided. Self signed certificate is used');
      sslKeyPath = resolve(__dirname, '../ssl/develop.key');
      sslCertPath = resolve(__dirname, '../ssl/develop.cert');
    }
    key = readFileSync(sslKeyPath, 'utf8');
    cert = readFileSync(sslCertPath, 'utf8');
  }
  return { key, cert };
}
