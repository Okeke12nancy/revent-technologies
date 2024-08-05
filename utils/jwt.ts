import { z } from "zod";
import { envValidator } from "./env";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors";
import { logger } from "./log";

envValidator({ JWT_SECRET: z.string() });

const JWT_SECRET = process.env.JWT_SECRET as string;

type TokenData = string;
type TokenPayload = { data: TokenData };

export const JWT = {
  sign: (data: TokenData, expiresIn?: string) => {
    return jwt.sign({ data, iat: Date.now() }, JWT_SECRET, { expiresIn });
  },
  verify: (token: string): TokenData => {
    try {
      return (jwt.verify(token, JWT_SECRET) as TokenPayload).data;
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        logger.warn(`${e.name}: ${e.message}`);
      }
      throw new UnauthorizedError("Invalid Token");
    }
  },
};
