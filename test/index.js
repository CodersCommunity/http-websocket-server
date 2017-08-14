import chai from 'chai'
import chaiHttp from 'chai-http'
import config from '../src/config'
import WebSocket from 'ws'
import '../dist/index.js'

chai.use(chaiHttp)
const expect = chai.expect
const httpURL = `http://${ config.host }:${ config.port.http }`
const wsURL = `ws://${ config.host }:${ config.port.ws }`
const token = config.token

describe('HTTP Server', () => {
	it('should return 200 on correct request', done => {
		chai.request(httpURL).post('/')
		.set({ token })
		.end((err, res) => {
			expect(res).to.have.status(200)
			done()
		})
	})

	it('should return 403 on unauthorized request', done => {
		chai.request(httpURL).post('/')
		.set({ token: 'Definitely not auth' })
		.send()
		.end((err, res) => {
			expect(res).to.have.status(403)
			done()
		})
	})

	it('should return 404 on unknown path request', done => {
		chai.request(httpURL).post('/unknown')
		.set({ token })
		.end((err, res) => {
			expect(res).to.have.status(404)
			done()
		})
	})

	it('should return 405 if method not allowed', done => {
		chai.request(httpURL).put('/')
		.set({ token })
		.end((err, res) => {
			expect(res).to.have.status(405)
			done()
		})
	})
})

describe('App', () => {
	it('should resend received data to websocket clients', done => {
		const wsClient = new WebSocket(wsURL)

		const tmpObj = {
			lorem: 'ipsum',
			dolor: 'set'
		}

		wsClient.on('message', data => {
			data = JSON.parse(data)
			expect(data).to.be.deep.equal(tmpObj)
			done()
		})

		chai.request(httpURL).post('/')
		.set({ token })
		.send(tmpObj)
		.end((err, res) => {})
	})
})