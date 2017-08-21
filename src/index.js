import express from 'express'
import bodyParser from 'body-parser'
import WebSocket from 'ws'
import axios from 'axios'
import { minify } from 'html-minifier'
import config from './config'

// create http server
const http = express()
http.use(bodyParser.json())
http.listen(config.port.http)

// create websocket server
const ws = new WebSocket.Server({ port: config.port.ws })

// check request
http.all('*', (req, res, next) => {

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
http.post('/', (req, res) => {

	// send response to forum server
	res.sendStatus(200)

	axios.get(config.forumUrl).then(forumResposne => {
		return forumResposne.data
	}).then(html => {

		// send only required data
		const startIndex = html.indexOf('<div class="qa-q-list ') + 47
		const endIndex = html.indexOf('<!-- END qa-q-list ') - 7
		html = html.slice(startIndex, endIndex)

		// minify html
		html = minify(html, {
			removeComments: true,
			collapseWhitespace: true
		})

		// get action type e.g. 'add-question'
		const action = req.body.action

		// send new HTML to websocket clients
		ws.clients.forEach(client => {
			const data = JSON.stringify({ action, html })
			client.send(data)
		})

	}).catch(err => {
		console.error(err)
	})

})