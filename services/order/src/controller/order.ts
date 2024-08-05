import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError, UnauthorizedError } from "../../../../utils/errors";

const validateListOrders = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const listOrders = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User Not Found");
  }

  const { page, limit } = validateListOrders.parse(req.query);

  const skip = (page - 1) * limit;

  const orders = (
    await db.order.findMany({
      where: { userId: req.user.id },
      skip,
      take: limit,
      include: {
        Product: { select: { name: true, description: true } },
        Auction: { select: { endDate: true } },
        AuctionBid: { select: { amount: true } },
      },
    })
  ).map((order) => ({
    id: order.id,
    userId: order.userId,
    productId: order.productId,
    productName: order.Product.name,
    productDescription: order.Product.description,
    amount: order.AuctionBid.amount,
    bidId: order.auctionBidId,
    auctionId: order.auctionId,
    auctionEndDate: order.Auction.endDate,
    createdAt: order.createdAt,
  }));

  return res.status(200).json({ orders });
});

const validateGetOrder = z.object({
  id: z.string(),
});
export const getOrder = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User Not Found");
  }

  const { id: orderId } = validateGetOrder.parse(req.params);

  const order = await db.order.findUnique({
    where: { id: orderId, userId: req.user.id },
    include: {
      Product: { select: { name: true, description: true } },
      Auction: { select: { endDate: true } },
      AuctionBid: { select: { amount: true } },
    },
  });

  if (!order) {
    throw new RequestError(404, "Cannot Get Order", "Order Not Found");
  }

  return res.status(200).json({
    id: order.id,
    userId: order.userId,
    productId: order.productId,
    productName: order.Product.name,
    productDescription: order.Product.description,
    amount: order.AuctionBid.amount,
    bidId: order.auctionBidId,
    auctionId: order.auctionId,
    auctionEndDate: order.Auction.endDate,
    createdAt: order.createdAt,
  });
});
