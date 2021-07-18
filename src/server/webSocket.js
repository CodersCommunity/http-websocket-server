import WebSocket from 'ws';
import mailer from '../mailer';
import * as VARS from '../vars';

const { HTTP_STATUS_CODES, GROUP_REGEXPS } = VARS;

class WebSocketServer {
  constructor(httpServer) {
    // console.log('??? httpServer:', httpServer);

    this.wss = new WebSocket.Server({ server: httpServer });
    this.wss.on('open', (e) => console.log('????open', e))
    this.wss.on('opening', (e) => console.log('????opening', e))
    this.wss.on('error', this.onWSSError.bind(this));
    this.wss.on('connection', this.onWSSConnection.bind(this));
    this.wss.on('close', this.onWSSClose.bind(this));

    this.mailSent = false;
  }

  assignWSClientToGroup(ws, pathname) {
    const pathName = pathname.replace(/\//g, '');
    const groupName = Object.keys(GROUP_REGEXPS).find((groupName) => GROUP_REGEXPS[groupName].test(pathName));
  
    if (!groupName) {
      console.error('ws unexpected groupName: ', groupName, ' from pathName: ', pathName);
      ws.close(HTTP_STATUS_CODES.WS_CLOSE_ERROR_CODE, 'Unexpected pathname!');
    }
  
    ws._GROUP_NAME = groupName;
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

  onWSSError(error) {
    console.error('WebSocket server error: ', error);
  
    if (!this.mailSent) {
      mailer.sendMail(`<p>Wystąpił błąd na serwerze WebSocket!<br><output>${JSON.stringify(error)}</output></p>`);
      this.mailSent = true;
    }
  }
  
  onWSSConnection(ws) {
    console.log('WS connected');

    ws.on('error', this.onWSError.bind(this));
    ws.on('message', this.onWSMessage.bind(this));
  }
  
  onWSSClose(event) {
    console.log('WebSocket server closed: ', event);
  }
  
  onWSMessage(event) {
    const parsedEvent = this.parseWSMessage(this, event);
    console.log('parsedEvent:',parsedEvent);
  
    if (!parsedEvent) {
      return;
    }
  
    this.assignWSClientToGroup(this, parsedEvent.pathname);
  }
  
  onWSError(event) {
    console.error('ws error event: ', event);
  
    if (!event.errno) {
      throw event;
    }
  }
}

export default WebSocketServer;