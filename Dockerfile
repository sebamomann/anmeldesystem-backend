# BUILDER
FROM node:12-alpine as builder

WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install

COPY . .

# testing
RUN npm run test:cov
# build
RUN npm run build


# ACTUAL IMAGE
FROM node:12-alpine

WORKDIR /usr/src/app

COPY --from=builder /app ./

CMD ["npm", "run", "start:prod"]
