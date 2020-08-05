import nodemailer from 'nodemailer';
import config from './config';

export default {
  sendMail: function (message) {
    const transporter = nodemailer.createTransport(config.mailer);

    const mailOptions = {
      from: config.mailer.auth.user,
      to: config.emailTo.toString(),
      subject: '!!! Błąd działania WebSocketu Forum Pasja Informatyki!',
      html: message,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return console.error(error);
      }
    });
  },
};
