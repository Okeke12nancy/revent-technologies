import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError } from "../../../../utils/errors";
import { nameValidator } from "../../../../utils/validators";
import { logger } from "../../../../utils/log";

const validateListUsers = z.object({
  emailFilter: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const listUsers = ControllerWrapper(async (req, res) => {
  const { emailFilter, page, limit } = validateListUsers.parse(req.query);

  const skip = (page - 1) * limit;

  const where = emailFilter
    ? {
        email: { contains: emailFilter },
      }
    : undefined;

  const users = (
    await db.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { Orders: true, Products: true, Auctions: true } },
      },
    })
  ).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    orderCount: user._count.Orders,
    productCount: user._count.Products,
    auctionCount: user._count.Auctions,
  }));

  return res.status(200).json({ users });
});

const validateUpdateUser = z.object({
  id: z.string(),
  name: nameValidator.optional(),
  email: z.string().email().optional(),
});

export const updateUser = ControllerWrapper(async (req, res) => {
  const { id, name, email } = validateUpdateUser.parse(
    Object.assign(req.body, req.params)
  ); // parse values from body and params

  try {
    await db.user.update({
      where: { id },
      data: { name, email },
    });
  } catch {
    throw new RequestError(404, "Cannot Update User", "User Not Found");
  }

  logger.info(`Admin ${req.admin.id} updated user ${id}`);
  res.status(200).send({ message: "User Updated Successfully" });
});

const validateDeleteUser = z.object({
  id: z.string(),
});
export const deleteUser = ControllerWrapper(async (req, res) => {
  const { id } = validateDeleteUser.parse(req.params);

  await db.user.delete({ where: { id } });

  logger.info(`Admin ${req.admin.id} deleted user ${id}`);
  res.status(200).send({ message: "User Deleted Successfully" });
});
