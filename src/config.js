import dotenv from 'dotenv';
import { readFileSync } from 'fs';
dotenv.config();

export const sslConfig = (() => {
  if (process.env.PROTOCOL === 'http') {
    return { key: '', cert: '' };
  }

  const logWarning = (name) =>
    console.warn(
      `\nWarning! Provided SSL ${name} path is empty. Falling back to default path.\nKeep in mind self signed SSL will be used, which is not secure.`
    );
  const key = getConfig('SSL_KEY_PATH');
  const cert = getConfig('SSL_CERT_PATH');

  return { key, cert };

  function getConfig(name) {
    let path = process.env[name];

    if (!path) {
      const shortName = name.split('_')[1].toLowerCase();
      logWarning(shortName);
      path = `ssl/develop.${shortName}`;
    }

    return readFileSync(path, 'utf8');
  }
})();

export default {
  token: process.env.TOKEN || 'secretKey',
  protocol: process.env.PROTOCOL || 'http',
  host: process.env.HOST || 'localhost',
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
