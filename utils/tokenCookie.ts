import type { Request } from "express";
import { UnauthorizedError } from "./errors";
import { z } from "zod";

const tokenCookieName = "REVENT_ECOMM_TOKEN";

export const getTokenCookie = (req: Request) => {
  let token = req.cookies[tokenCookieName] as string;
  if (!token) {
    throw new UnauthorizedError("No Token Provided");
  }

  try {
    token = z.string().parse(token);
  } catch {
    throw new UnauthorizedError("Invalid Token");
  }

  return token;
};

export const formatTokenCookie = (token: string) => {
  return `${tokenCookieName}=${token}; Path=/; HttpOnly`;
};
