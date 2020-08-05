import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import WebSocket from 'ws';
import axios from 'axios';
import { minify } from 'html-minifier';
import config from './config';
import { JSDOM } from 'jsdom';
// import mailer from './mailer'
import escape from 'escape-html';

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
server.listen(config.port.http);

const ERROR_CODES = Object.freeze({
  FORBIDDEN: 403,
  METHOD_NOT_ALLOWED: 405,
});

// TODO: separation for different forum pages, like: '/', '/activity' and certain questions
const GROUPS = {};

let mailSend = false;

const ws = new WebSocket.Server({ server });
debugger;
ws.on('error', onError);
ws.on('connection', onConnection);
ws.on('close', onClose);

// check request
app.all('*', onAll);

// send new list html to users
app.post('/', onPost);

function onError(error) {
  console.log('Socket error: ', error);
  // TODO: mail PM because socket server encountered an error
}

function onConnection(socket) {
  console.log('connected');

  ['close', 'error'].forEach((eventType) => {
    socket.on(eventType, (event) => {
      console.log('socket eventType: ', eventType, ' /event: ', event);
      if (eventType === 'error' && !event.errno) {
        throw event;
      }
    });
  });
}

function onClose() {
  console.log('closed');
}

function onAll(req, res, next) {
  // check authorization
  if (req.headers.token !== config.token) {
    res.sendStatus(ERROR_CODES.FORBIDDEN);
    return;
  }

  // check method
  if (req.method !== 'POST') {
    res.sendStatus(ERROR_CODES.METHOD_NOT_ALLOWED);
    return;
  }

  next();
}

function onPost(req, res) {
  // console.log('req.body: ', req.body);
  debugger;

  // send response to forum server
  res.sendStatus(200);

  axios
    .get(config.forumUrl)
    .then((forumResponse) => {
      console.log('forumResponse: ', forumResponse.data && forumResponse.data.slice(0, 100));
      return forumResponse.data;
    })
    .then((html) => {
      // send only required data
      // const startIndex = html.indexOf('<div class="qa-q-list') + 45
      // const endIndex = html.indexOf('<!-- END qa-q-list ') - 7
      // html = html.slice(startIndex, endIndex)

      // minify html
      // html = minify(html, {
      // 	removeComments: true,
      // 	collapseWhitespace: true
      // })

      debugger;

      const { document } = new JSDOM(html).window;
      const questionList = document.querySelector('.qa-q-list');
      console.log('questionList: ', questionList);

      // get action type e.g. 'add-question'
      const action = req.body.action;

      // check is HTML a valid question list
      if (questionList && questionList.children.length /*html.startsWith(`<div class="qa-q-list-item`)*/) {
        console.log('matched html -> send msg to client: ', ws.clients.size);

        // send new HTML to websocket clients
        ws.clients.forEach((client) => {
          debugger;

          const minifiedQuestionList = minify(questionList.innerHTML, {
            removeComments: true,
            collapseWhitespace: true,
          });
          const data = JSON.stringify({ action, minifiedQuestionList });

          client.send(data);
        });
      } else {
        console.log('not matched html...');
        // if (!mailSend) {
        // 	mailer.sendMail(`<p>Otrzymany HTML nie jest prawidłową listą pytań!</p><p>${escape( html )}</p>`)
        // 	mailSend = true
        // }
      }
    })
    .catch((err) => {
      console.error('err: ', err.toString(), ' /err keys: ', Object.keys(err));
      // mailer.sendMail(`<p>Błąd pobrania danych z forum!</p><p>${ err }</p>`)
    });
}
