import WebSocket from 'ws';
import fetch from 'node-fetch';
import mailer from '../mailer';
// eslint-disable-next-line import/no-namespace
import * as VARS from '../vars';
import config from '../config';

const { HTTP_STATUS_CODES, GROUP_REGEXPS } = VARS;

class WebSocketServerCore {
  constructor(httpServer) {
    this.mailSent = false;
    this.wss = new WebSocket.Server({ server: httpServer.server });
  }

  initWebSocketEvents(externalEventListenerList) {
    if (!Array.isArray(externalEventListenerList) || externalEventListenerList.length === 0) {
      throw TypeError('eventList argument must be non empty array!');
    }

    const coreEventListenerList = [
      {
        eventName: 'error',
        listener: this.onWSSError.bind(this),
      },
      {
        eventName: 'close',
        listener: WebSocketServerCore.onWSSClose,
      },
    ];

    [...coreEventListenerList, ...externalEventListenerList].forEach(({ eventName, listener }) => {
      if (!eventName || !listener) {
        throw ReferenceError(`
          event listener must contain: eventName and listener params!
          Received eventName: "${eventName}", listener: "${listener}"
        `);
      }

      this.wss.on(eventName, listener);
    });
  }

  static onWSSClose(event) {
    console.log('WebSocket server closed: ', event);
  }

  onWSSError(error) {
    console.error('WebSocket server error: ', error);

    if (!this.mailSent) {
      mailer.sendMail(`<p>Wystąpił błąd na serwerze WebSocket!<br><output>${JSON.stringify(error)}</output></p>`);
      this.mailSent = true;
    }
  }

  static onWSError(event) {
    console.error('WebSocket error event: ', event);

    if (!event.errno) {
      throw event;
    }
  }

  static parseWSMessage(event, ws) {
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
}

class WebSocketServer extends WebSocketServerCore {
  constructor(httpServer) {
    super(httpServer);

    this.USER_ID_URL = `${config.protocol}://${config.host}:${config.port.q2a}/user-id`;
    this.SUBPAGE_VISITORS_AMOUNT_MAP = (() => {
      // create pure object, without prototype
      const visitorsMap = Object.create(null);

      return {
        incrementIfExists(subPageName) {
          if (!(subPageName in visitorsMap)) {
            visitorsMap[subPageName] = 0;
          }

          visitorsMap[subPageName]++;
        },
        decrementAndEventuallyRemove(subPageName) {
          if (!(subPageName in visitorsMap) || visitorsMap[subPageName] === 0) {
            throw Error(`
              visitorsMap does not have property subPageName or it's value is 0!
              visitorsMap entries: "${Object.entries(visitorsMap)}", subPageName: "${subPageName}"
            `);
          }

          visitorsMap[subPageName]--;

          if (visitorsMap[subPageName] === 0) {
            delete visitorsMap[subPageName];
          }
        },
      };
    })();

    this.initWebSocketEvents([
      {
        eventName: 'connection',
        listener: this.onWSSConnection.bind(this),
      },
    ]);
    httpServer.attachSocketClientsNotifier(this.socketClientsNotifier.bind(this));
  }

  assignWSClientToGroup(pathName, ws) {
    if (!ws._CLIENT_META_DATA) {
      throw ReferenceError(
        'ws._CLIENT_META_DATA object does not exist! It should be declared inside WSS connection event listener.'
      );
    } else if (ws._CLIENT_META_DATA.groupName || ws._CLIENT_META_DATA.subPage) {
      throw Error(`ws._CLIENT_META_DATA.groupName with "${ws._CLIENT_META_DATA.groupName}" already exists!`);
    }

    const groupName = Object.keys(GROUP_REGEXPS).find((groupName) => GROUP_REGEXPS[groupName].test(pathName));

    if (!groupName) {
      console.error('ws unexpected groupName: ', groupName, ' from pathName: ', pathName);
      ws.close(HTTP_STATUS_CODES.WS_CLOSE_ERROR_CODE, 'Unexpected pathname!');

      return;
    }

    ws._CLIENT_META_DATA.groupName = groupName;
    ws._CLIENT_META_DATA.subPage = pathName;
    this.SUBPAGE_VISITORS_AMOUNT_MAP.incrementIfExists(pathName);
  }

  static getSessionCookie(reqHeaders) {
    const cookie = reqHeaders && reqHeaders.cookie;

    if (cookie) {
      const sessionCookie = cookie.split(' ').find((keyValuePair) => keyValuePair.split('=')[0] === 'qa_session');
      return sessionCookie || null;
    }

    return null;
  }

  getUserId(sessionCookie) {
    return fetch(this.USER_ID_URL, {
      headers: {
        cookie: sessionCookie,
        token: config.token,
      },
    })
      .then((res) => res.text())
      .then((userId) => Number(userId))
      .catch(console.error);
  }

  socketClientsNotifier(action, groupNames) {
    for (const wsClient of this.wss.clients) {
      console.log(
        '(socketClientsNotifier) groupNames:',
        groupNames,
        '\n/wsClient._CLIENT_META_DATA:',
        wsClient._CLIENT_META_DATA
      );

      if (groupNames.includes(wsClient._CLIENT_META_DATA.groupName)) {
        wsClient.send(JSON.stringify({ action }));
      }
    }
  }

  async onWSSConnection(ws, req) {
    if (ws._CLIENT_META_DATA) {
      throw ReferenceError(
        'ws._CLIENT_META_DATA object should not exist at that moment! WebSocket client duplication might happened.'
      );
    } else {
      ws._CLIENT_META_DATA = {};
    }

    ws._CLIENT_META_DATA.sessionCookie = WebSocketServer.getSessionCookie(req.headers);

    ws.on('error', WebSocketServerCore.onWSError);
    ws.on('message', (event) => this.onWSMessage(event, ws));
    ws.on('close', (event) => this.onWSClose(event, ws));

    ws._CLIENT_META_DATA.userId = await this.getUserId(ws._CLIENT_META_DATA.sessionCookie);
  }

  onWSMessage(event, ws) {
    const parsedEvent = WebSocketServerCore.parseWSMessage(event, ws);
    console.log('(onWSMessage) parsedEvent:', parsedEvent);

    if (!parsedEvent) {
      return;
    }

    this.assignWSClientToGroup(parsedEvent.pathname, ws);
  }

  onWSClose(event, ws) {
    console.log('(onWSClose) event:', event, ' /ws._CLIENT_META_DATA:', ws._CLIENT_META_DATA);

    this.SUBPAGE_VISITORS_AMOUNT_MAP.decrementAndEventuallyRemove(ws._CLIENT_META_DATA.subPage);
  }
}

export default WebSocketServer;
