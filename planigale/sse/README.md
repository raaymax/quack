# SSESource

The @planigale/sse library provides an easy and efficient way to handle
Server-Sent Events (SSE) in JavaScript and TypeScript. It includes tools for
both fetching and pushing events from/to the server.

- Fetching Events: The SSESource class allows you to connect to an SSE endpoint,
  handle events individually or in a loop, and gracefully manage connection
  closures.
- Pushing Events: The SSESink class facilitates sending events from the server
  to connected clients, making it simple to implement real-time updates in your
  application.

The library supports custom HTTP methods, headers, and request bodies, offering
flexibility for various use cases.

## Usage

### Fetching events from the server

```typescript
import { SSESource } from "jsr:@planigale/sse";

const source = new SSESource("https://example.com/sse", {
  method: "POST",
  headers: {
    "Authorization": "Bearer token",
  },
  body: JSON.stringify({ key: "value" }),
});

try {
  // Handling events one by one
  const { event, done } = await source.next();
  console.log("connection closed: ", done);
  if (!done) {
    console.log(event.data);
  }

  // Handling events in a loop
  for await (const event of source) {
    console.log(event.data);
  }
  console.log("connection closed");
} catch (e) {
  console.error(e);
}
```

### Pushing events on the server

```typescript
import { SSESink } from "jsr:@planigale/sse";

Deno.serve((req) => {
  if (req.method === "GET" && req.url === "/sse") {
    const sink = new SSESink();
    setInterval(() => {
      sink.sendMessage({ data: "Hello, world!" });
    }, 1000);
    return sink.getResponse();
  }
  return Response.error();
});
```

## License

MIT License

Copyright (c) 2024 Mateusz Russak
