<p align="center">
  <img src="https://raw.githubusercontent.com/raaymax/planigale/main/logo.webp" title="screenshot">
</p>

# Planigale

[![JSR @planigale](https://jsr.io/badges/@planigale)](https://jsr.io/@planigale)

## Packages

| Package                                                | Latest version                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [planigale](https://jsr.io/@planigale/planigale)       | [![JSR](https://jsr.io/badges/@planigale/planigale)](https://jsr.io/@planigale/planigale)     |
| [sse](https://jsr.io/@planigale/sse)                   | [![JSR](https://jsr.io/badges/@planigale/sse)](https://jsr.io/@planigale/sse)                 |
| [testing](https://jsr.io/@planigale/testing)           | [![JSR](https://jsr.io/badges/@planigale/testing)](https://jsr.io/@planigale/testing)         |
| [body-parser](https://jsr.io/@planigale/body-parser)   | [![JSR](https://jsr.io/badges/@planigale/body-parser)](https://jsr.io/@planigale/body-parser) |
| [schema](https://jsr.io/@planigale/schema)             | [![JSR](https://jsr.io/badges/@planigale/schema)](https://jsr.io/@planigale/schema)           |

## Description

Minimalistic HTTP framework for Deno

### `@planigale/planigale`

Main package with the core functionality, including routing, middleware, and request handling.

### `@planigale/sse`

Server-Sent Events Source and Sink this package is not bound to Planigale and can be used with any Deno server framework or in browser. It's entirely based on WEB API.

### `@planigale/testing`

Superagent inspired testing library for Planigale. It allows you to test your application with and without running the server.

### `@planigale/body-parser`

Middleware for Planigale that parses request body into JSON, text, or form data.

### `@planigale/schema`

Middleware for Planigale that validates request body against JSON schema using ajv.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make your changes and add tests
4. Run tests: `deno task check`
5. Commit your changes: `git commit -am 'feat: add some feature'`
    // use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
6. Push to the branch: `git push origin my-new-feature`
7. Submit a pull request :D

## License

MIT License

Copyright (c) 2024 Mateusz Russak
