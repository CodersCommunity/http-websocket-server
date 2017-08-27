import nodemailer from 'nodemailer'
import config from "./config"

export default {
    sendMail: function(message) {
        let transporter = nodemailer.createTransport(config.mailer)

        let mailOptions = {
            from: config.mailer.auth.user,
            to: config.emailTo.toString(),
            subject: '!!! Błąd działania WebSocketu Forum Pasja Informatyki!',
            html: message
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                return console.error(error)
            }
        })
    }
}