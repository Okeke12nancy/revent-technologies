import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError } from "../../../../utils/errors";
import { getTokenCookie } from "../../../../utils/tokenCookie";
import { JWT } from "../../../../utils/jwt";
import { nameValidator } from "../../../../utils/validators";

export const getProfile = ControllerWrapper(async (req, res) => {
  const token = getTokenCookie(req);
  const userId = JWT.verify(token);

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { Auctions: true, Orders: true, Products: true } },
    },
  });
  if (!user) {
    throw new RequestError(404, "Cannot Get Profile", "User Not Found");
  }

  return res.status(200).json({
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    orderCount: user._count.Orders,
    productCount: user._count.Products,
    auctionCount: user._count.Auctions,
  });
});

const validateUpdateProfile = z.object({
  name: nameValidator.optional(),
  email: z.string().email().optional(),
});

export const updateProfile = ControllerWrapper(async (req, res) => {
  const token = getTokenCookie(req);
  const userId = JWT.verify(token);

  const { name, email } = validateUpdateProfile.parse(req.body);

  try {
    await db.user.update({ where: { id: userId }, data: { name, email } });
  } catch {
    throw new RequestError(404, "Cannot Update Profile", "User Not Found");
  }
  return res.status(200).json({ message: "Profile Updated" });
});
