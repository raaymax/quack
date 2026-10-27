import {
  Ajv,
  AnySchema,
  type Format,
  type Options,
  type ValidateFunction,
} from "./deps.ts";
import {
  type Middleware,
  type Next,
  type Req,
  type Route,
  ValidationFailed,
} from "@planigale/planigale";

type ValidationBlock = "body" | "params" | "query" | "headers";
type ValidationError = {
  block: ValidationBlock;
  instancePath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
  schemaPath?: string;
};

export class SchemaValidator {
  ajv: Ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
  });
  validation: {
    [id: string]: {
      body?: ValidateFunction;
      params?: ValidateFunction;
      query?: ValidateFunction;
      headers?: ValidateFunction;
    };
  } = {};

  constructor(opts: Options = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      coerceTypes: true,
      ...opts,
    });
  }

  addSchema(schema: AnySchema | AnySchema[]) {
    this.ajv.addSchema(schema);
  }

  addFormat(name: string, format: Format) {
    this.ajv.addFormat(name, format);
  }

  addKeyword(definition: Parameters<Ajv["addKeyword"]>[0]) {
    this.ajv.addKeyword(definition);
  }

  compile(route: Route) {
    if (this.validation[route.id]) return;
    const def = route.definition;
    this.validation[route.id] = {
      body: def.schema?.body ? this.ajv.compile(def.schema.body) : undefined,
      params: def.schema?.params
        ? this.ajv.compile(def.schema.params)
        : undefined,
      query: def.schema?.query ? this.ajv.compile(def.schema.query) : undefined,
      headers: def.schema?.headers
        ? this.ajv.compile(def.schema.headers)
        : undefined,
    };
  }

  middleware: Middleware = async (req: Req, next: Next) => {
    if (req.route) {
      this.compile(req.route);
      await this.validate(req.route, req);
    }
    return await next();
  };

  async validate(route: Route, req: Req) {
    const errors: (ValidationError[] | null)[] = await Promise.all([
      this.#validateBlock(route, "body", req),
      this.#validateBlock(route, "params", req),
      this.#validateBlock(route, "query", req),
      this.#validateBlock(route, "headers", req),
    ]);
    const fmtErrors: ValidationError[] = errors.flat().filter((
      e: ValidationError | null,
    ) => e !== null);
    if (fmtErrors.length) {
      throw new ValidationFailed(fmtErrors);
    }
    return;
  }

  async #validateBlock(
    route: Route,
    block: ValidationBlock,
    req: Req,
  ): Promise<ValidationError[] | null> {
    const validate = this.validation[route.id][block];
    if (validate) {
      const validationResult: unknown = validate(req[block]);

      if (validationResult instanceof Promise) {
        try {
          await validationResult;
        } catch (e) {
          if (e instanceof Ajv.ValidationError) {
            return e.errors.map((e) => ({ ...e, block: block }));
          }
          throw new Error("Unexpected error", { cause: e });
        }
      } else if (!validationResult) {
        return validate.errors
          ?.map<ValidationError>((e) => ({
            ...e,
            block: block,
          })) ?? [];
      }
    }
    return null;
  }
}
