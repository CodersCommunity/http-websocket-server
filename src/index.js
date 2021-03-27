import http from 'http';
import https from 'https';
import express from 'express';
import bodyParser from 'body-parser';
import WebSocket from 'ws';
import config, { sslConfig } from './config';
import mailer from './mailer';

const app = express();
app.use(bodyParser.json());
const server = createServer();
server.listen(config.port.http, () =>
  console.log(`Server is listening on port ${config.port.http}, over ${config.protocol.toUpperCase()} protocol.`)
);

const HTTP_ERROR_CODES = Object.freeze({
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  WS_CLOSE_ERROR_CODE: 4000,
});
const GROUP_REGEXPS = Object.freeze({
  main: /^$|\/$/,
  activity: /^(\/?)activity/,
});
const GROUP_NAMES = Object.freeze({
  MAIN: 'main',
  ACTIVITY: 'activity',
});
const ACTIONS = Object.freeze({
  ADD_POST: 'add-post',
});

const wss = new WebSocket.Server({ server });
wss.on('error', onWSSError);
wss.on('connection', onWSSConnection);
wss.on('close', onWSSClose);

// check request
app.all('*', onAll);

// send new list html to users
app.post('/', onPost);

function createServer() {
  if (config.protocol === 'https') {
    return https.createServer(
      {
        key: sslConfig.key,
        cert: sslConfig.cert,
      },
      app
    );
  }

  return http.createServer(app);
}

let mailSent = false;

function onWSSError(error) {
  console.error('WebSocket server error: ', error);

  if (!mailSent) {
    mailer.sendMail(`<p>Wystąpił błąd na serwerze WebSocket!<br><output>${JSON.stringify(error)}</output></p>`);
    mailSent = true;
  }
}

function onWSSConnection(ws) {
  ws.on('error', onWSError);
  ws.on('message', onWSMessage);
}

function onWSSClose(event) {
  console.log('WebSocket server closed: ', event);
}

function onWSMessage(event) {
  const parsedEvent = parseWSMessage(this, event);

  if (!parsedEvent) {
    return;
  }

  assignWSClientToGroup(this, parsedEvent.pathname);
}

function onWSError(event) {
  console.error('ws error event: ', event);

  if (!event.errno) {
    throw event;
  }
}

function onAll(req, res, next) {
  // check authorization
  if (req.headers.token !== config.token) {
    res.sendStatus(HTTP_ERROR_CODES.FORBIDDEN);
    return;
  }

  if (req.method !== 'POST') {
    res.sendStatus(HTTP_ERROR_CODES.METHOD_NOT_ALLOWED);
    return;
  }

  next();
}

function parseWSMessage(ws, event) {
  let parsedEvent = {};

  try {
    if (!event) {
      throw Error('ws empty message event');
    }

    parsedEvent = JSON.parse(event);
  } catch (exception) {
    console.error('ws invalid JSON message: ', event, ' threw exception: ', exception);
    ws.close(HTTP_ERROR_CODES.WS_CLOSE_ERROR_CODE, 'Message is not valid JSON!');

    return null;
  }

  if (!parsedEvent.pathname) {
    console.error('ws empty pathname: ', parsedEvent.pathname);
    ws.close(HTTP_ERROR_CODES.WS_CLOSE_ERROR_CODE, 'Empty pathname!');

    return null;
  }

  return parsedEvent;
}

function assignWSClientToGroup(ws, pathname) {
  const pathName = pathname.replace(/\//g, '');
  const groupName = Object.keys(GROUP_REGEXPS).find((groupName) => GROUP_REGEXPS[groupName].test(pathName));

  if (!groupName) {
    console.error('ws unexpected groupName: ', groupName, ' from pathName: ', pathName);
    ws.close(HTTP_ERROR_CODES.WS_CLOSE_ERROR_CODE, 'Unexpected pathname!');
  }

  ws._GROUP_NAME = groupName;
}

function onPost(req, res) {
  res.sendStatus(200);

  const { action } = req.body;
  const groupNames = [GROUP_NAMES.ACTIVITY];

  if (action === ACTIONS.ADD_POST) {
    groupNames.push(GROUP_NAMES.MAIN);
  }

  for (const wsClient of wss.clients) {
    if (groupNames.includes(wsClient._GROUP_NAME)) {
      wsClient.send(JSON.stringify({ action }));
    }
  }
}
