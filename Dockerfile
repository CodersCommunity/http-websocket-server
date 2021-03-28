FROM node:10-alpine as builder

WORKDIR /app

COPY ./package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:10-alpine as runtime

WORKDIR /app

COPY --from=builder /app/ ./ 
ENV NODE_ENV production
RUN npm ci

CMD ["npm", "run", "serve"]

