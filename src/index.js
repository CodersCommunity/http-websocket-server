import http from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import WebSocket from 'ws'
import axios from 'axios'
import { minify } from 'html-minifier'
import config from './config'
import { JSDOM } from 'jsdom'
// import mailer from './mailer'
import escape from 'escape-html'

// create http server
const app = express()
app.use(bodyParser.json())
const server = http.createServer(app);
server.listen(config.port.http)
let mailSend = false

// create websocket server
const ws = new WebSocket.Server({ server })

// check request
app.all('*', (req, res, next) => {

	// check authorization
	if (req.headers.token !== config.token) {
		res.sendStatus(403) // Forbidden
		return
	}

	// check method
	if (req.method !== 'POST') {
		res.sendStatus(405) // Method Not Allowed
		return
	}

	next()
})

// send new list html to users
app.post('/', (req, res) => {
	// console.log('req.body: ', req.body);
	debugger;

	// send response to forum server
	res.sendStatus(200)

	axios.get(config.forumUrl).then(forumResposne => {
		// console.log('forumResposne: ', forumResposne);
		return forumResposne.data
	}).then(html => {

		// send only required data
		// const startIndex = html.indexOf('<div class="qa-q-list') + 45
		// const endIndex = html.indexOf('<!-- END qa-q-list ') - 7
		// html = html.slice(startIndex, endIndex)

		// minify html
		// html = minify(html, {
		// 	removeComments: true,
		// 	collapseWhitespace: true
		// })

		debugger;
		const { document } = new JSDOM(html).window;
		const questionList = document.querySelector('.qa-q-list');
		console.log('minified html: ', questionList);

	// get action type e.g. 'add-question'
	const action = req.body.action

	// check is HTML a valid question list
	if (questionList && questionList.children.length /*html.startsWith(`<div class="qa-q-list-item`)*/) {
		console.log('matched html -> send msg to client: ', ws.clients.size);

		// send new HTML to websocket clients
		ws.clients.forEach(client => {
			debugger;
			const minifiedQuestionList = minify(questionList.innerHTML, {
				removeComments: true,
				collapseWhitespace: true
			})
			const data = JSON.stringify({ action, minifiedQuestionList })
			client.send(data)
		})
	} else {
		console.log('not matched html...');
		// if (!mailSend) {
		// 	mailer.sendMail(`<p>Otrzymany HTML nie jest prawidłową listą pytań!</p><p>${escape( html )}</p>`)
		// 	mailSend = true
		// }
	}

	}).catch(err => {
		console.error('err: ', err);
		// mailer.sendMail(`<p>Błąd pobrania danych z forum!</p><p>${ err }</p>`)
	})

})

