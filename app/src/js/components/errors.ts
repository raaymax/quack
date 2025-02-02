export class PageNotFoundError extends Error {
  constructor() {
    super("Page not found");
    this.name = "PageNotFoundError";
  }
}

export class InitFailedError extends Error {
  constructor() {
    super("Initialization failed");
    this.name = "InitFailedError";
  }
}
