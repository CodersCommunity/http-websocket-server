import express from 'express'
import bodyParser from 'body-parser'
import WebSocket from 'ws'
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

// resend received data to websocket clients
http.post('/', (req, res) => {

	// parse received data
	const data = JSON.stringify(req.body || {})

	// send data to websocket clients
	ws.clients.forEach(client => {
		client.send(data)
	})

	// http response: OK
	res.sendStatus(200)
})