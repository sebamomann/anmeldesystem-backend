FROM node:10

WORKDIR /usr/src

COPY package*.json ./
RUN npm install

COPY . .

CMD [ "node", "src/main.ts" ]