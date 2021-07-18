import HttpServer from './server/http';
import WebSocketServer from './server/webSocket';

const httpServer = new HttpServer();
new WebSocketServer(httpServer);
