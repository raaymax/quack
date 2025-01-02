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

Welcome to Quack, a free and open-source chat application designed for private use. Quack offers an easy-to-use interface and seamless integration with web browsers, making it a Progressive Web Application accessible from any platform with a web browser, such as Chrome.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="app/public/screenshot-dark.png">
  <img alt="Quack the best chat app on the market" src="app/public/screenshot-light.png">
</picture>

Inspired by Slack but more affordable for private use, Quack combines the best features from other communicators while prioritizing privacy and security. Users can host their own app, ensuring complete control over their data.

## Features

- Progressive Web Application (PWA)
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
- Customizable notifications
- Plugin system for extensibility

## Quick Start

The fastest way to get started is to use the Docker compose. Using following command will start the application with default settings in no time.
```
docker compose up -d
```
navigate to [http://localhost:8080](http://localhost:8080) and use default credentials to login `admin / 123`.

## Configuration

To override default settings `chat.config.ts` file can be created in root directory of the project. You can use `chat.config.example.ts` as a template.
File should export folowing object:
```typescript
type Config = {
  port?: number // default `PORT` env otherwise `8080`
  sessionSecret?: string // auto generated on first run to `secrets.json` but can be overwritten here
  trustProxy?: bool | string | number // default `uniquelocal` ref: https://expressjs.com/en/guide/behind-proxies.html
  vapid?: { // auto generated on first run to `secrets.json` but can be overwritten here
    publicKey: string
    secretKey: string
  },
  databaseUrl?: string // default `DATABASE_URL` env
  cors?: string[] // by default [ 'https?://localhost(:[0-9]{,4})' ],
  storage?: { // Where uploaded files should be stored
    type: 'memory' | 'gcs' | 'fs' // default `fs` / `memory` in tests
    directory: string // where to save files when type `fs`
    bucket: string // bucket name for `gcs`
  }
  apiUrl?: string // default 'http://localhost:8080' url of api
  appUrl?: string // default 'http://localhost:8081' url for frontend app
};
```

## Environment variables

`GOOGLE_APPLICATION_CREDENTIALS` [string] - (optional) when gcs storage method is used

## Running the Project

### Pre-requisites
- Install [Deno](https://deno.land/)
- Node.js and npm (for managing frontend dependencies and running React)
- MongoDB

### Backend
To start the server:
```sh
cd ./deno/server
deno task dev
```

### Frontend
Install dependencies and start the React app:
```sh
cd ./app
npm install
npm run dev
```

### Storybook
To start the storybook:
```sh
cd ./app
npm install
npm run storybook
```

## Files persistence
Currently supporting Google Cloud Storage. To enable it set `fileStorage` in config file to `gcs` specify `gcsBucket`
and set `GOOGLE_APPLICATION_CREDENTIALS` environment variable.

## Decisions

### Database
We're using a serverless MongoDB instance because of its reliability and cost-effectiveness - we only pay for what we use.
The cheapest option available on Mongo Atlas is sufficient for application, as we don't require any internal pub/sub functionality.


### Server
It would be nice to have a serverless solution, but for now, the cheapest option is using GCE. 
I have no idea how to propagate messages to other serverless instances without a hosted pub/sub service.
MongoDB, Redis, and Postgres need to be hosted to watch for messages.
Perhaps Google Cloud Pub/Sub would be a good option?

## Plugins
Chat have plugin system. Example plugin can be found in `plugins/example`.
How to use plugins and plugin hook points TBA.


## Default credentials

```
admin / 123
```
New users can be invited with `/invite` command which will generate single use link for user registration.

## Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change. Ensure to update tests as appropriate.

## License

MIT License

Copyright (c) 2023 CodeCat
