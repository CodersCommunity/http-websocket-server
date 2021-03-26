import chai from 'chai';
import chaiHttp from 'chai-http';
import config from '../src/config';
import WebSocket from 'ws';
import { minify } from 'html-minifier';
import '../dist/index.js';

chai.use(chaiHttp);
const expect = chai.expect;
const httpURL = `http://${config.host}:${config.port.http}`;
const wsURL = `ws://${config.host}:${config.port.ws}`;
const token = config.token;

const { beforeEachCb, afterEachCb, getWsClient } = (() => {
  let wsClient = null;

  return { beforeEachCb, afterEachCb, getWsClient };

  function beforeEachCb(done) {
    wsClient = new WebSocket(wsURL);

    wsClient.on('error', (e) => console.log('errored! ', e));
    wsClient.on('open', () => {
      done();
    });
  }

  function afterEachCb(done) {
    wsClient.on('close', () => {
      wsClient = null;
      done();
    });
    wsClient.terminate();
  }

  function getWsClient() {
    return wsClient;
  }
})();

describe('HTTP Server', () => {
  beforeEach(beforeEachCb);

  afterEach(afterEachCb);

  it('should return 200 on correct request', (done) => {
    chai
      .request(httpURL)
      .post('/')
      .set({ token })
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('should return 403 on unauthorized request', (done) => {
    chai
      .request(httpURL)
      .post('/')
      .set({ token: 'Definitely not auth' })
      .send()
      .end((err, res) => {
        expect(res).to.have.status(403);
        done();
      });
  });

  it('should return 404 on unknown path request', (done) => {
    chai
      .request(httpURL)
      .post('/unknown')
      .set({ token })
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  });

  it('should return 405 if method not allowed', (done) => {
    chai
      .request(httpURL)
      .put('/')
      .set({ token })
      .end((err, res) => {
        expect(res).to.have.status(405);
        done();
      });
  });
});

describe('App', () => {
  beforeEach(beforeEachCb);

  afterEach(afterEachCb);

  it('should send valid HTML to websocket clients', (done) => {
    getWsClient().on('message', (data) => {
      const { minifiedQuestionList } = JSON.parse(data);

      expect(() => {
        try {
          minify(minifiedQuestionList);
        } catch (err) {
          throw new Error('Invalid HTML');
        }
      }).to.not.throw(Error);

      done();
    });

    chai
      .request(httpURL)
      .post('/')
      .set({ token })
      .send()
      .end((err, res) => {});
  });
});
