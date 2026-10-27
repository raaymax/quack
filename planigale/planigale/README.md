<p align="center">
  <img src="https://raw.githubusercontent.com/raaymax/planigale/main/logo.webp" title="screenshot">
</p>

# Planigale

## Description

Minimalistic HTTP framework for Deno

## Usage

### Deno

Planigale is available on both deno.land/x and JSR. For deno.land/x use the
following import:

```typescript
import { Planigale } from "https://deno.land/x/planigale/mod.ts";
```

For JSR use the following import:

```typescript
import { Planigale } from "jsr:@planigale/planigale";
```

or add it to your import maps:

```bash
deno add @planigale/planigale
```

### NPM

Maybe in future

### Basic example

```typescript
import { Planigale } from "jsr:@planigale/planigale";

const app = new Planigale();

// Simple logging middleware
app.use(async (req, next) => {
  const ts = new Date().toISOString();
  const log = ts + ": " + req.method + " " + req.url;
  console.time(log);
  const res = await next();
  console.timeEnd(log);
  return res;
});

app.route({
  method: "GET",
  url: "/users/:id",
  handler: async (req) => {
    const id = req.params.id;
    return Response.json({ id });
  },
});

app.serve({ port: 8000 });
```

### Defining routes

Routes are meant to produce a response to a particular request. They are defined
by the `route` method of the app object. The method takes an object with the
following properties:

```typescript
type RouteDefinition = {
  method: string;
  url: string;
  description?: string;
  schema?: object;
  handler: (req: Req) => Promise<Res | Response>;
};
```

**Validation support**

Planigale supports validation of request body and query parameters using ajv
library. ajv is not native to Deno, so this can change in the future. For
validation json schema is used.

```typescript
app.route({
  method: "GET",
  url: "/users/:id",
  schema: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "number" },
      },
    },
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", pattern: "Bearer .+" },
      },
    },
  },
  handler: async (req) => {
    const id = req.params.id;
    return Response.json({ id });
  },
});

const request: Request = new Request("http://localhost:3000/users/invalid_id", {
  method: "GET",
  headers: {
    authorization: "invalid_token",
  },
});

const response: Response = await app.handle(request);

assertEquals(response.status, 400);
assertEquals(await response.json(), [
  {
    block: "params",
    instancePath: "/id",
    keyword: "type",
    message: "must be number",
    params: {
      type: "number",
    },
    schemaPath: "#/properties/id/type",
  },
  {
    block: "headers",
    instancePath: "/authorization",
    keyword: "pattern",
    message: 'must match pattern "[Bb]earer .*"',
    params: {
      pattern: "[Bb]earer .*",
    },
    schemaPath: "#/properties/authorization/pattern",
  },
]);
```

### Middleware

Middleware is a function that has access to the request object, the response
object, and the next middleware function in the application’s request-response
cycle. The next middleware function is commonly denoted by a variable named
next.

````typescript
app.use(async (req, next) => {
    console.log("Before", req.url);
    const res = await next();
    console.log("After", req.url);
    return res;
});

## Testing

### Unit testing
Planigale is designed to be easily testable. You can test your handlers without running the server.
```typescript
import { Planigale } from "@planigale/planigale";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const app = new Planigale();

const route = app.route({
  method: "GET",
  url: "/users/:id",
  handler: async (req) => {
    const id = req.params.id;
    const id = req.state.user.name;
    return Res.json({ id, name });
  },
})

Deno.test("Chaking endpoints output", async () => {
    const req = new Req("/users/1", {method: "GET", state: {user: {name: "John"}}});
    const res = await route.handler(req);
    assertEquals(res.status, 200);
    assertEquals(res.body, { id: "1", name: "john" });
})
````

### Module testing

Whole app can be easlily tested using just one function that take Request object
as an argument and return Response object.

```typescript
import { Planigale } from "https://deno.land/x/planigale/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const app = new Planigale();

app.route({
  method: "GET",
  url: "/users/:id",
  handler: async (req) => {
    const id = req.params.id;
    return Res.json({ id });
  },
});

Deno.test("Chaking endpoints output", async () => {
  const request: Request = new Request("http://localhost:3000/users/1", {
    method: "GET",
  });

  const response: Response = await app.handle(request);

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { id: "1" });
});
```

### Integration testing

```typescript
Deno.test("Chaking full app", async (t) => {
  const app = new Planigale();

  app.route({
    method: "GET",
    url: "/users/:id",
    handler: async (req, res) => {
      const id = req.params.id;
      res.send({ id });
    },
  });

  t.step("start up", async () => {
    await app.serve(3000);
  });

  t.step("GET /users/1", async () => {
    const request: Request = new Request("http://localhost:3000/users/1", {
      method: "GET",
    });

    const response: Response = await fetch(request);

    assertEquals(response.status, 200);
    assertEquals(await response.json(), { id: "1" });
  });

  t.step("tear down", async () => {
    await app.close();
  });
});
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make your changes and add tests
4. Run tests: `deno task check`
5. Commit your changes: `git commit -am 'feat: add some feature'` // use
   [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
6. Push to the branch: `git push origin my-new-feature`
7. Submit a pull request :D

## License

MIT License

Copyright (c) 2024 Mateusz Russak
