export default {
		token: 'secretKey',
		host: 'localhost',
		forumUrl: 'https://forum.pasja-informatyki.pl/',
		port: {
			http: 3000/*80*/,
			ws: 3000
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

