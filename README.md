# http-websocket-server
Serwer umożliwiający asynchroniczne wysyłanie danych do użytkowników.
```
       (1) akcja
User  --------------→  Forum (Q2A)
      ←--------------
       [(4) pobranie]   |
                        | (2) info
                        ↓
Users ←--------------  WS-HTTP (Node.js)
       (3) powiadomienie
```
1) (*POST*) user wykonuje akcję: dodanie odpowiedzi, komentarza, edycja etc.
2) (*POST*) Q2A informuje Node o updacie
3) (*WS*) Node powiadamia o akcji wszystkich klientów podpiętych do WS i przynależących do danej grupy klientów przebywających na odpowiedniej stronie forum:
   - głównej (`/`)
   - `/activity`
4) **[opcjonalne]** (*GET*) user pobiera aktualną listę postów klikając w powiadomienie

Z kodem naszego forum to chyba jedyne sensowne rozwiązanie.

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
