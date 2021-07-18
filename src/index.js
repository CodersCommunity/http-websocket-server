import HttpServer from './server/http';
import WebSocketServer from './server/webSocket';

const httpServer = new HttpServer();
const wsServer = new WebSocketServer(httpServer.server);
// console.log('wsServer:', wsServer.wss);
