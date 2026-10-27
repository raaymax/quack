/**
 * ApiError contains the status code and error code.
 * And will be sent as a response to the client with the specified status code and error code.
 * This is base class for errors and is intended to be extended.
 */
export class ApiError extends Error {
  /** The HTTP status code of the error. */
  status: number;
  /** The error code, used for identifying the error. */
  errorCode: string;
  /** If the error should be logged or not. */
  log: boolean = true;

  headers: Record<string, string> = {};

  /**
   * Create a new ApiError.
   * @param status The HTTP status code of the error.
   * @param errorCode The error code, used for identifying the error.
   * @param message The error message.
   */
  constructor(status: number, errorCode: string, message?: string) {
    super(message ?? errorCode);
    this.status = status;
    this.errorCode = errorCode;
  }

  /**
   * Serialize the error to a JSON object.
   * This function is called just before sending the response to the client.
   * @returns The serialized error.
   */
  serialize(): Record<string, unknown> {
    return {
      errorCode: this.errorCode,
      message: this.message,
    };
  }

  /**
   * Serialize the error to a api response.
   */
  toResponse(): Response {
    return Response.json(this.serialize(), {
      status: this.status,
      headers: this.headers,
    });
  }

  /** @ignore */
  [Symbol.for("Deno.customInspect")](): string {
    return `ApiError: [${this.errorCode}] ${this.status} ${this.message}\n` +
      `${this.stack?.split("\n").slice(1).join("\n")}`;
  }
}

/**
 * ValidationFailed is an error that is thrown when the validation of a request fails.
 */
export class ValidationFailed extends ApiError {
  /** The errors that caused the validation to fail. */
  errors: unknown;
  /** If the error should be logged or not. */
  override log: boolean = false;

  /**
   * Create a new ValidationFailed error.
   * @param errors The errors that caused the validation to fail.
   */
  constructor(errors: unknown) {
    super(400, "VALIDATION_ERROR", "Validation failed");
    this.errors = errors;
  }

  /** @inheritDoc */
  override serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      errors: this.errors,
    };
  }
}

/**
 * InternalServerError is an error that is thrown when an unexpected error occurs.
 */
export class InternalServerError extends ApiError {
  /** The original error that caused the internal server error. */
  originalError: unknown;

  /**
   * Create a new InternalServerError.
   * @param e The original error that caused the internal server error.
   */
  constructor(e: unknown) {
    super(500, "INTERNAL_SERVER_ERROR", InternalServerError.extractMessage(e));
    this.originalError = e;
  }

  /**
   * @internal
   * Extract the message from an error.
   */
  static extractMessage(e: unknown): string {
    if (e instanceof Error) {
      return e.message;
    } else {
      return String(e) || "Internal server error";
    }
  }

  /** @inheritDoc */
  override serialize(): Record<string, unknown> {
    if (this.originalError instanceof Error) {
      return {
        ...super.serialize(),
        stack: this.originalError.stack?.split("\n"),
        originalError: this.originalError,
      };
    } else {
      return {
        ...super.serialize(),
        originalError: this.originalError,
      };
    }
  }

  override toString(): string {
    if (this.originalError instanceof Error) {
      return `InternalServerError: ${this.message}\n${this.originalError.message}\n\n${this.originalError.stack}`;
    } else {
      return `InternalServerError: ${this.message}\n${this.originalError}`;
    }
  }
}

/**
 * ResourceNotFound is an error that is thrown when a resource is not found.
 * Status code: 404
 */
export class ResourceNotFound extends ApiError {
  /** If the error should be logged or not. */
  override log: boolean = false;

  /**
   * Create a new ResourceNotFound error.
   * @param message The error message.
   */
  constructor(message: string) {
    super(404, "RESOURCE_NOT_FOUND", message);
  }
}
