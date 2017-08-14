# http-websocket-server
Serwer umożliwiający asynchroniczne wysyłanie danych do użytkowników forum.
```
                HTTP POST
Serwer forum     -----→     Serwer HTTP-WebSocket

 ↑                          |||
 | HTTP update              ||| socket message
 |                          ↓↓↓

Użytkownik                 Użytkownicy
```

## Instalacja
```
npm install
npm run build
npm run serve
```

## Dev
```
npm run dev
```

## Testy
```
npm run test
```