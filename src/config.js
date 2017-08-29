import fs from 'fs'

export default {
	token: 'secretKey',
	host: 'localhost',
	forumUrl: 'http://fpi.pl/',
	port: 3000,
	ssl: {
		key: fs.readFileSync('sslcert/key.pem', 'utf8'),
		cert: fs.readFileSync('sslcert/cert.pem', 'utf8')
	},
	mailer: {
		host: '',
		port: 587,
		secure: false,
		auth: {
			user: '',
			pass: ''
		},
		tls: {
			rejectUnauthorized: true
		}
	},
	emailTo: [
		''
	]
}
