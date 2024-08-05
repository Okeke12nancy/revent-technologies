import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { UnauthorizedError } from "../../../../utils/errors";
import { JWT } from "../../../../utils/jwt";
import { getTokenCookie } from "../../../../utils/tokenCookie";

/** Validate request is made by an admin and add admin details to request object */
export const adminAuthMiddleware = ControllerWrapper(async (req, _, next) => {
  const token = getTokenCookie(req);
  const adminId = JWT.verify(token);

  const admin = await db.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new UnauthorizedError("Admin Not Found");
  }

  req.admin = admin;

  next();
});
