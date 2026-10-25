<p align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="app/public/dark.png">
  <img alt="Quack the best chat app on the market" src="app/public/light.png">
</picture>
</p>

[![Tests](https://github.com/raaymax/chat/actions/workflows/tests.yml/badge.svg)](https://github.com/raaymax/chat/actions/workflows/tests.yml)
[![Release](https://shields.io/github/v/release/raaymax/chat?display_name=tag)](https://shields.io/github/v/release/raaymax/chat?display_name=tag)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Welcome to the Quack - private chatting application.

Welcome to Quack, a free and open-source chat application designed for private
use. Quack offers an easy-to-use interface and seamless integration with web
browsers, making it a Progressive Web Application accessible from any platform
with a web browser, such as Chrome.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="app/public/screenshot-dark.png">
  <img alt="Quack the best chat app on the market" src="app/public/screenshot-light.png">
</picture>

Inspired by Slack but more affordable for private use, Quack combines the best
features from other communicators while prioritizing privacy and security. Users
can host their own app, ensuring complete control over their data.

# Features

- E2EE support for more privacy
- Progressive Web Application (PWA)
- Native Android app with background notifications
- Self-hosted for privacy and security
- Multi-channel support
- Direct messaging
- Pinning messages
- Message search
- File sharing
- Emoji reactions
- Custom emojis
- Message threading
- User mentions
- Link previews
- Plugin system for extensibility

# Quick Start

## Using Docker Hub

[https://registry.hub.docker.com/r/codecat/quack](https://registry.hub.docker.com/r/codecat/quack)

## Using GitHub repository

The fastest way to get started is to use the Docker compose after the code
checkout. Using following command will start the application with default
settings in no time.

```
docker compose up -d
```

navigate to [http://localhost:8080](http://localhost:8080) and use default
credentials to login `admin / 123`.

# Configuration

To override default settings `chat.config.ts` file can be created in root
directory of the project. You can use `chat.config.example.ts` as a template.
File should export folowing object:

```typescript
type Config = {
  port?: number; // default `PORT` env otherwise `8080`
  sessionSecret?: string; // auto generated on first run to `secrets.json` but can be overwritten here
  trustProxy?: bool | number | string | string[]; // default `loopback, linklocal, uniquelocal`
  anonymousRequestLog?: { // record requests without a valid session
    enabled?: boolean // default true
  }
  loginRateLimit?: { // failed login limits
    windowMinutes?: number; // default 15
    maxFailuresPerIp?: number; // default 10
    maxFailuresPerEmail?: number; // default 5
  };
  vapid?: { // auto generated on first run to `secrets.json` but can be overwritten here
    publicKey: string;
    secretKey: string;
  };
  databaseUrl?: string; // default `DATABASE_URL` env
  cors?: string[]; // by default [ 'https?://localhost(:[0-9]{,4})' ],
  storage?: { // Where uploaded files should be stored
    type: "memory" | "gcs" | "fs"; // default `fs` / `memory` in tests
    directory: string; // where to save files when type `fs`
    bucket: string; // bucket name for `gcs`
  };
  apiUrl?: string; // default 'http://localhost:8080' url of api
  appUrl?: string; // default 'http://localhost:8081' url for frontend app
};
```

## port

port on which application will start

## sessionSecret

this value will overwrite the one from `secrets.json`

## trustProxy

Which proxies may set `X-Forwarded-For`. The client IP is used for login
monitoring and rate limiting, so only trust proxies you control.

- `false` - ignore `X-Forwarded-For`, use the connecting address
- `true` - trust every hop (use the left-most address)
- number - trust that many hops in front of the server
- string or list - addresses or CIDR ranges (`10.0.0.0/8`), comma separated,
  plus presets `loopback`, `linklocal` and `uniquelocal`

## loginRateLimit

Failed logins are counted per client IP and per email within a sliding window.
When either limit is reached the login endpoint answers `429` with a
`Retry-After` header until older failures leave the window. A successful login
resets the per-email counter.

## Login monitoring

Every login attempt is stored in the `loginAttempts` collection for 90 days and
logged as `[auth] login <outcome> ip=<ip> email=<email>`. Outcomes are
`success`, `failure`, `blocked` and `reset_required`. To see a summary of
failures, blocked IPs, attacked accounts and unknown emails:

```
deno task auth:logins            # last 24h
deno task auth:logins --hours=168 --limit=20
deno task auth:logins --json
```

## Anonymous traffic
Every request without a valid session (no token, or an expired / unknown one)
is stored in the capped `anonymousRequests` collection (512 MB, oldest entries
are dropped first). Each entry keeps the client IP and proxy chain, method,
path, query, matched route, status, error code, timing, user agent, referer,
origin, language, all request headers and up to 4 KB of the request body.
Secrets are never stored: `Authorization` and cookie values are redacted, reset
and invitation tokens are removed from paths and queries, and bodies sent to
`/api/auth` and `/api/users` are skipped. Unknown routes answer `404` for every
method so probes like `POST /admin` are captured too.
```
deno task security:traffic                 # summary of the last 24h
deno task security:traffic --hours=168 --limit=20
deno task security:traffic --ip=1.2.3.4    # every request from one IP
deno task security:traffic --json
```

## databaseUrl

connection string to mongodb instance. By default this value is taken from env
variable `DATABASE_URL`. example:

```
mongodb://chat:chat@localhost:27017/chat?authSource=admin
```

## cors

This allows to host frontend and backend on different domains For development
this option is set to:

```
cors: [ 'https?://localhost(:[0-9]{,4})' ]
```

to allow running vite and deno together in separate processes to have full
automatic reloads on code changes

## storage

Storage option for file uploads.

```
storage: {
  type: 'memory' | 'fs' | 'gcs'
}
```

### memory

Used for tests no files need to be stored persistently

### FS

Store files in filesystem You can configure folder in which files will be stored
using `storage.directory` field.

### GCS

Save files in Google Cloud Storage good choice for prroduction use. in this case
you need to specify `storage.bucket` field and env variable needs to be defined
`GOOGLE_APPLICATION_CREDENTIALS` [string] with path to google application
credentials

### S3

Not implemented, I will implement it if there will be some interest in it.
Please create issue for it.

## apiUrl

url to the api if different than appUrl

## appUrl

url to the app used for links generation

# Running the Project

## Pre-requisites

- Install [Deno](https://deno.land/)
- Node.js and npm (for managing frontend dependencies and running React)
- MongoDB

## Backend

To start the server:

```sh
cd ./deno/server
deno task dev
```

## Frontend

Install dependencies and start the React app:

```sh
cd ./app
npm install
npm run dev
```

## Storybook

To start the storybook:

```sh
cd ./app
npm install
npm run storybook
```

## Mobile App

Build the native Android app with background push notifications:

```sh
cd ./mobile
npm install
export QUACK_SERVER_URL="https://your-quack-server.com"
npm run cap:sync
npm run cap:open  # Opens Android Studio
```

See [Mobile App Documentation](docs/mobile-app.md) for detailed setup
instructions.

# Documentation

- [System Architecture](docs/ARCHITECTURE.md) — Backend layers, frontend
  patterns, data flow, encryption
- [Coding Conventions](docs/CONVENTIONS.md) — File naming, component patterns,
  import order, git workflow
- [Architecture Decision Records](docs/adr/README.md) — 12 ADRs covering
  runtime, state management, encryption, and more
- [Mobile App](docs/mobile-app.md) — Capacitor Android build setup

# Plugins

Chat have plugin system. Example plugin can be found in `plugins/example`. How
to use plugins and plugin hook points TBA.

# Default credentials

```
admin / 123
```

New users can be invited with `/invite` command which will generate single use
link for user registration.

# Contributing

Contributions are welcome. For major changes, please open an issue first to
discuss what you would like to change. Ensure to update tests as appropriate.

# License

MIT License

Copyright (c) 2023 CodeCat
