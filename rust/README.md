# quack-server (Rust)

Axum + MongoDB rewrite of the Deno backend. Wire-compatible with the existing
React client and `@quack/api`, and uses the same MongoDB collections.

## Run

```bash
cargo run                 # serve (runs migrations first)
cargo run -- migrate      # migrations only
cargo run -- invite       # print a registration link for the main channel
```

On an empty database the server applies a baseline schema (indexes, system
user, `main` channel) and records the legacy Deno migrations as applied. Use
`invite` to create the first account. An existing database must have all
legacy migrations applied before the server will start.

## Configuration

Optional JSON file (`CONFIG`, default `chat.config.json`), overridden by env:

| Env                 | JSON                     | Default                    |
| ------------------- | ------------------------ | -------------------------- |
| `PORT`              | `port`                   | `4001`                     |
| `DATABASE_URL`      | `databaseUrl`            | local `chat` database      |
| `BASE_URL`          | `baseUrl`                | `http://localhost:<port>`  |
| `PUBLIC_DIR`        | `publicDir`              | `app/dist`                 |
| `STORAGE_TYPE`      | `storage.type`           | `fs`                       |
| `STORAGE_DIRECTORY` | `storage.directory`      | `uploads`                  |
| `STORAGE_BUCKET`    | `storage.bucket`         | -                          |
| `GIPHY_API_KEY`     | `plugins.giphy.apiKey`   | disabled                   |
| `APP_VERSION`       | -                        | -                          |
| -                   | `webhooks[]`             | `[]`                       |

GCS credentials are resolved by `object_store` (service account file,
`GOOGLE_APPLICATION_CREDENTIALS`, or the instance metadata server).

## Test

```bash
cargo test                # Rust tests (needs MongoDB, uses `rust_tests` db)
```

Run the Deno route suite against a running Rust server:

```bash
CONFIG=tests/chat.config.json APP_VERSION=1.2.3 PORT=4011 STORAGE_TYPE=memory \
  DATABASE_URL='mongodb://chat:chat@localhost:27017/tests?authSource=admin' \
  cargo run &
QUACK_TEST_TARGET=http://localhost:4011 deno task test deno/server/inter/http/routes
```
