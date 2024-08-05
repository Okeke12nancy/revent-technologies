import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError } from "../../../../utils/errors";
import { logger } from "../../../../utils/log";

const validateListProducts = z.object({
  nameFilter: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const listProducts = ControllerWrapper(async (req, res) => {
  const { nameFilter, page, limit } = validateListProducts.parse(req.query);

  const skip = (page - 1) * limit;
  const where = nameFilter
    ? {
        name: { contains: nameFilter },
      }
    : undefined;
  const products = await db.product.findMany({ where, skip, take: limit });
  return res.status(200).json({ products });
});

const validateUpdateProduct = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const updateProduct = ControllerWrapper(async (req, res) => {
  const { id, name, description } = validateUpdateProduct.parse(
    Object.assign(req.body, req.params)
  );

  try {
    await db.product.update({ where: { id }, data: { name, description } });
  } catch {
    throw new RequestError(404, "Cannot Update Product", "Product Not Found");
  }

  logger.info(`Admin ${req.admin.id} updated product ${id}`);
  return res.status(200).json({ message: "Product Updated Successfully" });
});

const validateDeleteProduct = z.object({
  id: z.string(),
});

export const deleteProduct = ControllerWrapper(async (req, res) => {
  const { id } = validateDeleteProduct.parse(req.params);

  await db.product.delete({ where: { id } });

  logger.info(`Admin ${req.admin.id} deleted product ${id}`);
  return res.status(200).json({ message: "Product Deleted Successfully" });
});
