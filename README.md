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

# Features

- E2EE support for more privacy
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
- Plugin system for extensibility

# Quick Start
## Using Docker Hub
[https://registry.hub.docker.com/r/codecat/quack](https://registry.hub.docker.com/r/codecat/quack)

## Using GitHub repository
The fastest way to get started is to use the Docker compose after the code checkout. Using following command will start the application with default settings in no time.
```
docker compose up -d
```
navigate to [http://localhost:8080](http://localhost:8080) and use default credentials to login `admin / 123`.

# Configuration

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

## port
port on which application will start
## sessionSecret
this value will overwrite the one from `secrets.json`
## trustProxy
to trust proxy or not. 
## databaseUrl
connection string to mongodb instance. By default this value is taken from env variable `DATABASE_URL`.
example:
```
mongodb://chat:chat@localhost:27017/chat?authSource=admin
```
## cors
This allows to host frontend and backend on different domains
For development this option is set to:
```
 cors: [ 'https?://localhost(:[0-9]{,4})' ]
```
to allow running vite and deno together in separate processes to have full automatic reloads on code changes
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
Store files in filesystem
You can configure folder in which files will be stored using `storage.directory` field.

### GCS
Save files in Google Cloud Storage good choice for prroduction use.
in this case you need to specify `storage.bucket` field and env variable needs to be defined
`GOOGLE_APPLICATION_CREDENTIALS` [string] with path to google application credentials

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

# Plugins
Chat have plugin system. Example plugin can be found in `plugins/example`.
How to use plugins and plugin hook points TBA.


# Default credentials

```
admin / 123
```
New users can be invited with `/invite` command which will generate single use link for user registration.

# Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change. Ensure to update tests as appropriate.

# License

MIT License

Copyright (c) 2023 CodeCat
