FROM node:10

ARG version
ENV version $version

WORKDIR /usr/src

COPY package*.json ./
RUN npm install
RUN npm version ${version}
RUN npm build

COPY . ./dist/*

CMD [ "node", "main.ts" ]