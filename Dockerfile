FROM node:10

WORKDIR /usr/src

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD [ "node", "src/main.ts" ]