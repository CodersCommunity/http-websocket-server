import WebSocket from 'ws';
import fetch from 'node-fetch';
import mailer from '../mailer';
import * as VARS from '../vars';
import config from '../config';

const { HTTP_STATUS_CODES, GROUP_REGEXPS } = VARS;


class WebSocketServer {
  constructor(httpServer) {
    this.mailSent = false;

    this.wss = new WebSocket.Server({ server: httpServer.server });
    this.wss.on('open', (e) => console.log('????open', e));
    this.wss.on('opening', (e) => console.log('????opening', e));
    this.wss.on('error', this.onWSSError.bind(this));
    this.wss.on('connection', this.onWSSConnection.bind(this));
    this.wss.on('close', this.onWSSClose.bind(this));

    httpServer.attachSocketClientsNotifier(this.socketClientsNotifier.bind(this));
  }

  assignWSClientToGroup(pathname, ws) {
    const pathName = pathname.replace(/\//g, '');
    const groupName = Object.keys(GROUP_REGEXPS).find((groupName) => GROUP_REGEXPS[groupName].test(pathName));

    if (!groupName) {
      console.error('ws unexpected groupName: ', groupName, ' from pathName: ', pathName);
      ws.close(HTTP_STATUS_CODES.WS_CLOSE_ERROR_CODE, 'Unexpected pathname!');
    }

    ws._CLIENT_META_DATA = {
      groupName /*, cookie*/,
    };
  }

  parseWSMessage(ws, event) {
    let parsedEvent = {};

    try {
      if (!event) {
        throw Error('ws empty message event');
      }

      parsedEvent = JSON.parse(event);
    } catch (exception) {
      console.error('ws invalid JSON message: ', event, ' threw exception: ', exception);
      ws.close(HTTP_STATUS_CODES.WS_CLOSE_ERROR_CODE, 'Message is not valid JSON!');

      return null;
    }

    if (!parsedEvent.pathname) {
      console.error('ws empty pathname: ', parsedEvent.pathname);
      ws.close(HTTP_STATUS_CODES.WS_CLOSE_ERROR_CODE, 'Empty pathname!');

      return null;
    }

    return parsedEvent;
  }

  getSessionCookie(reqHeaders) {
    const cookie = reqHeaders && reqHeaders.cookie;

    if (cookie) {
      const sessionCookie = cookie.split(' ').find((c) => c.includes('qa_session'));

      return sessionCookie ? sessionCookie.split('=')[1] : null;
    }

    return null;
  }

  socketClientsNotifier(action, groupNames) {
    for (const wsClient of this.wss.clients) {
      console.log(
        '(socketClientsNotifier) groupNames:',
        groupNames,
        ' /wsClient._CLIENT_META_DATA:',
        wsClient._CLIENT_META_DATA
      );

      if (groupNames.includes(wsClient._CLIENT_META_DATA)) {
        wsClient.send(JSON.stringify({ action }));
      }
    }
  }

  onWSSError(error) {
    console.error('WebSocket server error: ', error);

    if (!this.mailSent) {
      mailer.sendMail(`<p>Wystąpił błąd na serwerze WebSocket!<br><output>${JSON.stringify(error)}</output></p>`);
      this.mailSent = true;
    }
  }

  onWSSConnection(ws, req) {
    console.log('WebSocket connected');
    
    const sessionCookie =this.getSessionCookie(req.headers)
    console.log('sessionCookie:', sessionCookie);
    
    fetch(`${config.protocol}://${config.host}:${config.port.q2a}/user-id`/*'http://localhost:4080/user-id'*/, {
      headers: {
        cookie: `qa_session=${sessionCookie}`,
        token: config.token,
      }
    })
      .then(res => res.text())
      .then(userId => console.log('userId:', Number(userId)))
      .catch(console.error)

    ws.on('error', this.onWSError.bind(this));
    ws.on('message', (event) => this.onWSMessage(event, ws));
  }

  onWSSClose(event) {
    console.log('WebSocket server closed: ', event);
  }

  onWSMessage(event, ws) {
    const parsedEvent = this.parseWSMessage(this, event);
    console.log('parsedEvent:', parsedEvent);

    if (!parsedEvent) {
      return;
    }

    this.assignWSClientToGroup(parsedEvent.pathname, ws);
  }

  onWSError(event) {
    console.error('WebSocket error event: ', event);

    if (!event.errno) {
      throw event;
    }
  }
}

export default WebSocketServer;
