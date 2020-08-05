const prodUrlArg = process.argv[2];
const useProdURL = prodUrlArg === 'prodURL';

export default {
  token: 'secretKey',
  host: 'localhost',
  forumUrl: useProdURL ? 'https://forum.pasja-informatyki.pl/' : 'http://localhost/',
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
