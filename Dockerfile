FROM denoland/deno:alpine-2.1.6 AS build
RUN mkdir -p /app
WORKDIR /app
COPY . .
RUN deno install --allow-scripts
ENV APP_NAME=quack
ARG APP_VERSION=3.x.x
ENV APP_VERSION=$APP_VERSION
RUN APP_NAME=quack APP_VERSION=$APP_VERSION deno task build

FROM denoland/deno:alpine-2.1.6
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
RUN chmod +x ./entrypoint.sh
EXPOSE 8080
CMD ["sh", "./entrypoint.sh"]
