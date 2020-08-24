FROM node:10 as builder
WORKDIR /app
COPY ./package.json ./
RUN npm install
COPY . .
RUN apk --no-cache add curl
# RUN npm run test:cov
RUN npm run prebuild
RUN npm run build

FROM node:10-alpine
WORKDIR /app
COPY --from=builder /app ./
CMD ["npm", "run", "start:prod"]
