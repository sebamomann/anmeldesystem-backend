FROM node:10

ARG version
ENV version $version

WORKDIR /usr/src

COPY package*.json ./
RUN npm install
RUN npm version ${version}
RUN npm run-script build

RUN ls -la

COPY dist/ . 

RUN ls -la

CMD [ "node", "main" ]