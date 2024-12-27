import {
  ApiError,
  InternalServerError,
  Middleware,
  ResourceNotFound,
} from "@planigale/planigale";
import { AppError } from "../../core/errors.ts";
import * as AppErrors from "../../core/errors.ts";

export const errorHandler: Middleware = async (req, next) => {
  try {
    return await next();
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    if (e instanceof AppError) {
      throw mapAppError(e);
    }
    console.log(e);
    throw new InternalServerError(e);
  }
};

function mapAppError(error: AppError): ApiError {
  switch (error.errorCode) {
    case "RESOURCE_NOT_FOUND":
      return new ResourceNotFound(error.message);
    case "ACCESS_DENIED":
      return new AccessDenied(error.message);
    case "NO_ACCESS":
      return new NoAccess(error.message);
    case "NOT_OWNER":
      return new NotOwner(error.message);
    case "USER_ALREADY_EXISTS":
      return new UserAlreadyExists(error.message);
    case "PASSWORD_RESET_REQUIRED":
      return new PasswordResetRequired(error as AppErrors.PasswordResetRequired)
    case "INVALID_INVITATION": {
      const invalidInvitation = new ApiError(
        400,
        "INVALID_INVITATION",
        error.message,
      );
      invalidInvitation.log = false;
      return invalidInvitation;
    }
    default:
      return new InternalServerError(error);
  }
}
export class NoAccess extends ApiError {
  override log = false;

  constructor(message: string) {
    super(403, "NO_ACCESS", message);
  }
}

export class AccessDenied extends ApiError {
  override log = false;

  constructor(message: string) {
    super(401, "ACCESS_DENIED", message);
  }
}

export class NotOwner extends ApiError {
  override log = false;

  constructor(message: string) {
    super(403, "NOT_OWNER", message);
  }
}
export class PasswordResetRequired extends ApiError {
  override log = false;
  token: string

  constructor(error: {message: string, token: string}) {
    super(403, "PASSWORD_RESET_REQUIRED", error.message);
    this.token = error.token;
  }

  override serialize() {
    return {
      ...super.serialize(),
      token: this.token
    }
  }
}

export class UserAlreadyExists extends ApiError {
  override log = false;

  constructor(message: string) {
    super(409, "USER_ALREADY_EXISTS", message);
  }
}
