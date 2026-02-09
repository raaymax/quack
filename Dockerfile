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

FROM denoland/deno:alpine-2.6.8
# WORKAROUND: Deno alpine image ships glibc-linked libs in /usr/local/lib/ that break
# apk and post-install triggers (libz, libcrypto, libzstd, libgcc_s shadow Alpine's musl libs).
# Move them aside during apk install, then restore for Deno compatibility.
# See: https://github.com/denoland/deno_docker/issues/373 — remove when fixed upstream
RUN mv /usr/local/lib /usr/local/lib.bak \
    && mkdir /usr/local/lib \
    && apk -U upgrade \
    && apk add vips-cpp build-base vips vips-dev \
    && rm -rf /usr/local/lib \
    && mv /usr/local/lib.bak /usr/local/lib
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
