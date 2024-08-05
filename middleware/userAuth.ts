import { db } from "../utils/db";
import { UnauthorizedError } from "../utils/errors";
import { JWT } from "../utils/jwt";
import { getTokenCookie } from "../utils/tokenCookie";
import { ControllerWrapper } from "./error";

export const userAuthMiddleware = ControllerWrapper(async (req, _, next) => {
  const token = getTokenCookie(req);
  const id = JWT.verify(token);

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new UnauthorizedError("User Not Found");
  }

  req.user = user;

  next();
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        password: string;
        name: string;
        createdAt: Date;
      };
    }
  }
}
