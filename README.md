# http-websocket-server
Serwer umożliwiający asynchroniczne wysyłanie danych do użytkowników.
```
       (1) update
User  --------------→  Forum

                        | ↑| (2) POST - Hej, jest update!
                        | ||
                        ↓ |↓ (3) GET - Spoko, wyrenderuj mi HTML
       (4) nowy HTML
Users ←--------------  WS-HTTP serwer
```
Z koden naszego forum to chyba jedyne sensowne rozwiązanie.

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