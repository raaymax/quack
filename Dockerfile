FROM node:22.12-alpine AS build
RUN mkdir -p /app
WORKDIR /app
COPY . .
WORKDIR /app/app
RUN npm install 
RUN mv node_modules ../node_modules
ENV APP_NAME=quack
ARG APP_VERSION=3.x.x
ENV APP_VERSION=$APP_VERSION
RUN APP_NAME=quack APP_VERSION=$APP_VERSION npm run build

FROM denoland/deno:alpine-2.5.0
RUN apk -U upgrade
RUN apk add vips-cpp build-base vips vips-dev
ENV ENVIRONMENT=production
RUN mkdir -p /app
WORKDIR /app
COPY . .
COPY --from=build /app/app/dist /app/public
#COPY ./migrate-mongo-config.js ./migrate-mongo-config.js
#RUN deno cache --allow-scripts npm:migrate-mongo
RUN deno install --allow-scripts
COPY ./entrypoint.sh ./entrypoint.sh

ENV PUBLIC_DIR=/app/public
ENV PORT=8080
ARG APP_VERSION=3.x.x
ENV APP_VERSION=$APP_VERSION
RUN echo "APP_VERSION=$APP_VERSION"
ENV GOOGLE_SDK_NODE_LOGGING=1
RUN chmod +x ./entrypoint.sh
EXPOSE 8080
CMD ["sh", "./entrypoint.sh"]
