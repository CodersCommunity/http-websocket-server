import http from 'http';
import https from 'https';
import express from 'express';
import bodyParser from 'body-parser';
import config, { sslConfig } from '../config';
import { HTTP_STATUS_CODES, GROUP_NAMES, ACTIONS } from '../vars';

class HttpServerCore {
  constructor() {
    this.server = null;
    this.app = null;
    this.socketClientsNotifier = () => console.error('Method not attached!');
  }

  initConnectionWithQ2A(middlewareList) {
    this.app = express();
    this.app.use(bodyParser.json());

    if (!Array.isArray(middlewareList) || middlewareList.length === 0) {
      throw TypeError('middlewareList argument must be non empty array!');
    }

    middlewareList.forEach(({ method, path, listener }) => {
      if (!method || !path || !listener) {
        throw ReferenceError(`
          middleware must contain: method, path and listener params!
          Received method: "${method}", path: "${path}", listener: "${listener}"
        `);
      }

      this.app[method](path, listener);
    });
  }

  initServerForWebSocket() {
    this.server = this.createHttpServerWithOptionalCert();
    this.server.listen(config.port.http, () =>
      console.log(`Server is listening on port ${config.port.http}, over ${config.protocol.toUpperCase()} protocol.`)
    );
  }

  createHttpServerWithOptionalCert() {
    if (config.protocol === 'https') {
      return https.createServer(
        {
          key: sslConfig.key,
          cert: sslConfig.cert,
        },
        this.app
      );
    }

    return http.createServer(this.app);
  }

  attachSocketClientsNotifier(fn) {
    this.socketClientsNotifier = fn;
  }
}

class HttpServer extends HttpServerCore {
  constructor() {
    super();
    this.initConnectionWithQ2A([
      {
        method: 'all',
        path: '*',
        listener: HttpServer.onAll,
      },
      {
        method: 'post',
        path: '/',
        listener: this.onPost.bind(this),
      },
    ]);
    this.initServerForWebSocket();
  }

  static onAll(req, res, next) {
    if (req.headers.token !== config.token) {
      res.sendStatus(HTTP_STATUS_CODES.FORBIDDEN);
      return;
    }

    if (req.method !== 'POST') {
      res.sendStatus(HTTP_STATUS_CODES.METHOD_NOT_ALLOWED);
      return;
    }

    next();
  }

  onPost(req, res) {
    console.log('POST...', req.body);

    res.sendStatus(200);

    const { action } = req.body;
    const groupNames = [GROUP_NAMES.ACTIVITY];

    console.log('(onPost) action:', action, '\n/groupNames:', groupNames, '\n/ACTIONS:', ACTIONS);

    if (action === ACTIONS.ADD_POST) {
      groupNames.push(GROUP_NAMES.MAIN);
    }

    this.socketClientsNotifier(action, groupNames);
  }
}

export default HttpServer;
