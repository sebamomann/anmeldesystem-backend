FROM node:10

ARG version

WORKDIR /usr/src

COPY package*.json ./
RUN npm install
RUN "npm version ${version}"

COPY . .

CMD [ "node", "src/main.ts" ]