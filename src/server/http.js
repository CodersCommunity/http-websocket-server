import http from 'http';
import https from 'https';
import express from 'express';
import bodyParser from 'body-parser';
import config, { sslConfig } from '../config';
import { HTTP_STATUS_CODES, GROUP_NAMES, ACTIONS } from '../vars';

class HttpServer {
  constructor() {
    this.server = null;
    this.app = null;

    this.initConnectionWithQ2A();
    this.initServerForWebSocket();
  }

  initConnectionWithQ2A() {
    this.app = express();
    this.app.use(bodyParser.json());

    // check request
    this.app.all('*', this.onAll.bind(this));

    // send new list html to users
    this.app.post('/', this.onPost.bind(this));
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
      );
    }
  
    return http.createServer();
  }

  onAll(req, res, next) {
    console.log('(onAll) req.url', req.url);

    // check authorization
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
      console.log('POST...', req.body)

      res.sendStatus(200);
    
      const { action } = req.body;
      const groupNames = [GROUP_NAMES.ACTIVITY];

      console.log('(onPost) action:', action, ' /groupNames:', groupNames, ' /ACTIONS:', ACTIONS);
    
      if (action === ACTIONS.ADD_POST) {
        groupNames.push(GROUP_NAMES.MAIN);
      }
    
      for (const wsClient of wss.clients) {
        if (groupNames.includes(wsClient._GROUP_NAME)) {
          wsClient.send(JSON.stringify({ action }));
        }
      }
    }
}

export default HttpServer;