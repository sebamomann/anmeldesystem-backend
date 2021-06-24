# BUILDER
FROM node:12-alpine as builder
LABEL stage=intermediate

# couchbase sdk requirements
RUN apk update && apk add yarn curl bash python g++ make && rm -rf /var/cache/apk/*

# install node-prune (https://github.com/tj/node-prune)
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin


WORKDIR /app

COPY ./package.json ./

RUN rm -rf node_modules
RUN npm install

COPY . .

# testing
# RUN npm run test:cov
# build
RUN npm run prebuild
RUN npm run build
RUN npm prune --production

# run node prune
RUN /usr/local/bin/node-prune

# ACTUAL IMAGE
# ACTUAL IMAGE
# ACTUAL IMAGE
FROM node:12-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN apk --no-cache add curl

CMD ["node", "./dist/main.js"]
