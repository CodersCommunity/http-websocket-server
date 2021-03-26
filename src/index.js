import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import WebSocket from 'ws';
import config from './config';
import mailer from './mailer';

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
server.listen(config.port.http, () => console.log(`Server is listening on port ${config.port.http}`));

const HTTP_ERROR_CODES = Object.freeze({
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
  WS_CLOSE_ERROR_CODE: 4000,
});
const GROUP_REGEXPS = Object.freeze({
  main: /^$|\/$/,
  activity: /^(\/?)activity/,
});

let mailSent = false;

const wss = new WebSocket.Server({ server });
wss.on('error', onWSSError);
wss.on('connection', onWSSConnection);
wss.on('close', onWSSClose);

// check request
app.all('*', onAll);

// send new list html to users
app.post('/', onPost);

function onWSSError(error) {
  console.log('WebSocket server error: ', error);

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
  const groupName = action === 'add-post' ? 'main' : 'activity';

  for (const wsClient of wss.clients) {
    if (wsClient._GROUP_NAME === groupName || wsClient._GROUP_NAME === 'activity') {
      wsClient.send(JSON.stringify({ action }));
    }
  }
}
