FROM node:10

ARG version
ENV version $version

WORKDIR /usr/src

COPY package*.json ./
RUN npm install
RUN npm version ${version}
RUN nom build

COPY . ./dist/*

CMD [ "node", "main.ts" ]