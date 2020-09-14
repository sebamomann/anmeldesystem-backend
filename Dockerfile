FROM node:10 as builder
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run test:cov
RUN npm run prebuild
RUN npm run build

FROM node:10-alpine
WORKDIR /app
COPY --from=builder /app ./
RUN apk --no-cache add curl
CMD ["npm", "run", "start:prod"]
