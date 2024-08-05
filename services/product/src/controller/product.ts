import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError, UnauthorizedError } from "../../../../utils/errors";
import { nameValidator } from "../../../../utils/validators";
import { logger } from "../../../../utils/log";

const validateListProducts = z.object({
  nameFilter: z.string().optional(),
  userId: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const listProducts = ControllerWrapper(async (req, res) => {
  const { nameFilter, userId, page, limit } = validateListProducts.parse(
    req.query
  );

  const skip = (page - 1) * limit;
  const where = {} as Record<string, unknown>;
  if (nameFilter) where.name = { contains: nameFilter };
  if (userId) where.userId = userId;

  const products = (
    await db.product.findMany({
      where,
      skip,
      take: limit,
    })
  ).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    userId: product.userId,
    status: product.status,
    createdAt: product.createdAt,
  }));

  return res.status(200).json({ products });
});

const validateAddProducts = z.object({
  name: nameValidator,
  description: z.string().min(5).max(500),
});

export const addProduct = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { name, description } = validateAddProducts.parse(req.body);

  const product = await db.product.create({
    data: {
      name,
      description,
      userId: req.user.id,
      status: "NONE",
    },
  });

  logger.info(`User ${req.user.id} added new product ${product.id} ${name}`);
  return res
    .status(200)
    .json({ message: "Product Added Successfully", productId: product.id });
});

const validateGetProduct = z.object({ id: z.string() });

export const getProduct = ControllerWrapper(async (req, res) => {
  const { id } = validateGetProduct.parse(req.params);
  const product = await db.product.findUnique({ where: { id } });
  if (!product) {
    throw new RequestError(404, "Cannot Get Product", "Product Not Found");
  }
  return res.status(200).json({ product });
});

export const deleteProduct = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { id } = validateGetProduct.parse(req.params);
  // only delete products that belong to the user
  try {
    await db.product.delete({ where: { id, userId: req.user.id } });
  } catch {
    throw new RequestError(404, "Cannot Delete Product", "Product Not Found");
  }

  logger.info(`User ${req.user.id} deleted product ${id}`);
  return res.status(200).json({ message: "Product Deleted Successfully" });
});

const validateUpdateProduct = z.object({
  id: z.string(),
  name: nameValidator.optional(),
  description: z.string().min(5).max(500).optional(),
});

export const updateProduct = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { id, name, description } = validateUpdateProduct.parse(
    Object.assign(req.body, req.params)
  );

  try {
    // only update products that belong to the user
    await db.product.update({
      where: { id, userId: req.user.id },
      data: { name, description },
    });
  } catch {
    throw new RequestError(404, "Cannot Update Product", "Product Not Found");
  }

  logger.info(`User ${req.user.id} updated product ${id}`);
  return res.status(200).json({ message: "Product Updated Successfully" });
});
