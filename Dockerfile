FROM node:20-alpine3.20 as build
RUN mkdir -p /app
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
COPY ./app/package.json ./app/package.json
RUN npm install
COPY . .
ENV APP_NAME=quack
COPY ./version* ./
RUN APP_VERSION=$(cat ./version 2>/dev/null || echo 3) npm run build

FROM denoland/deno:alpine-2.1.2
RUN apk -U upgrade
run apk add vips-cpp build-base vips vips-dev
ENV ENVIRONMENT=production
run mkdir -p /app
WORKDIR /app
COPY ./deno ./deno
COPY ./migrations ./migrations
COPY ./deno.* ./
COPY ./plugins ./plugins
COPY --from=build /app/app/dist /app/public
COPY --from=build /app/node_modules /app/node_modules
#COPY ./migrate-mongo-config.js ./migrate-mongo-config.js
#RUN deno cache --allow-scripts npm:migrate-mongo
RUN deno install --allow-scripts
COPY ./entrypoint.sh ./entrypoint.sh

ENV PUBLIC_DIR=/app/public
ENV PORT=8080
ARG APP_VERSION=3.x.x
ENV APP_VERSION=$APP_VERSION
RUN chmod +x ./entrypoint.sh
EXPOSE 8080
CMD sh ./entrypoint.sh
