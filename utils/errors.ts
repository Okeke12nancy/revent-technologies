import { ZodError } from "zod";
import { logger } from "./log";

export class CustomError extends Error {
  constructor(
    public statusCode: number,
    public error: unknown,
    public cause: string
  ) {
    super(error instanceof Error ? error.message : (error as string));
  }

  toJSON() {
    return {
      message: this.error,
      cause: this.cause,
    };
  }
}

const INVALID_INPUT = "Invalid Input";

export class InputValidationError extends CustomError {
  constructor(error: unknown) {
    super(400, error, INVALID_INPUT);
    logger.warn(INVALID_INPUT);
  }

  toJSON(): { message: unknown; cause: string } {
    if (this.error instanceof ZodError) {
      return {
        message: this.error.issues,
        cause: INVALID_INPUT,
      };
    }

    if (this.error instanceof Error) {
      return {
        message: this.error.message,
        cause: INVALID_INPUT,
      };
    }

    return {
      message: this.error,
      cause: INVALID_INPUT,
    };
  }
}

export class RequestError extends CustomError {
  constructor(statusCode: number, error: unknown, cause: string) {
    super(statusCode, error, cause);
    logger.error(cause);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(cause: string) {
    super(401, "Unauthorized", cause);
    logger.error(cause);
  }
}

export class InternalServerError extends CustomError {
  constructor(error: unknown) {
    super(500, "Internal Server Error", "Unknown");
    logger.error(error);
  }
}

export class UnreachableCodeError extends InternalServerError {
  constructor(error?: unknown) {
    super("UNREACHABLE_CODE");
    logger.error(error);
  }
}
