import {
  CustomError,
  InputValidationError,
  InternalServerError,
} from "../utils/errors";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";

/** Automatically handle request errors */
export const errorHandler = (
  err: unknown,
  _: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const e =
    err instanceof ZodError
      ? new InputValidationError(err)
      : !(err instanceof CustomError)
        ? new InternalServerError(err)
        : err;

  return res.status(e.statusCode).json(e.toJSON());
};

/**
 * Automatically catch errors in route handlers
 * Ensure `errorHandler` is attached to the route after this is used
 * */
export function ControllerWrapper(controller: RequestHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
