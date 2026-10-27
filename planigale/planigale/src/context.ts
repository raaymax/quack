import type { Req } from "./req.ts";
import type { Route } from "./route.ts";
import type { BaseRoute } from "./route.ts";

export class Context {
  #url: string;
  pattern?: URLPattern;
  route?: BaseRoute;

  constructor(url: string = "", private parent?: Context) {
    this.#url = url;
  }

  goto(url: string, route: BaseRoute): Context {
    const ctx = new Context(url, this);
    ctx.route = route;
    return ctx;
  }

  end(pattern: URLPattern, route: Route): EndContext {
    return new EndContext(pattern, route, this);
  }

  getRoutes(): BaseRoute[] {
    return [
      this.route,
      ...this.parent?.getRoutes() ?? [],
    ].filter(Boolean) as BaseRoute[];
  }

  get strictMode(): boolean {
    return this.parent?.strictMode ?? false;
  }

  get url(): string {
    return (this.parent?.url ?? "") + this.#url;
  }
}

export class RootContext extends Context {
  #strictMode: boolean;

  constructor(strictMode: boolean = false) {
    super("");
    this.#strictMode = strictMode;
  }

  override get strictMode(): boolean {
    return this.#strictMode;
  }
}

export class EndContext extends Context {
  constructor(
    public override pattern: URLPattern,
    public override route: Route,
    parent: Context,
  ) {
    super("", parent);
  }
  preProcess(req: Req) {
    if (!this.pattern) throw new Error("Malformed context");
    const match = this.pattern.exec(req.url);
    req.params = match?.pathname.groups ?? {};
    req.path = match?.pathname.input ?? "";
    req.route = this.route;
  }
}
