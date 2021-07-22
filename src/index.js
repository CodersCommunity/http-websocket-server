import HttpServer from './server/http';
import WebSocketServer from './server/webSocket';

const httpServer = new HttpServer();
// eslint-disable-next-line no-new
new WebSocketServer(httpServer);
