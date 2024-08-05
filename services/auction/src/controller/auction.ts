import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import {
  cancelScheduledAuctionEnd,
  scheduleAuctionEnd,
} from "../../../../utils/auctionQueue";
import { RequestError, UnauthorizedError } from "../../../../utils/errors";
import { logger } from "../../../../utils/log";

const validateListAuctions = z.object({
  status: z.enum(["OPEN", "CLOSED", "ALL"]).optional(),
  productId: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

export const listAuctions = ControllerWrapper(async (req, res) => {
  const { status, productId, page, limit } = validateListAuctions.parse(
    req.query
  );

  const skip = (page - 1) * limit;
  const where = {} as Record<string, unknown>;
  if (status) {
    switch (status) {
      case "OPEN":
        where.endDate = { gte: new Date() };
        break;
      case "CLOSED":
        where.endDate = { lt: new Date() };
        break;
    }
  }
  if (productId) where.productId = productId;

  const auctions = (
    await db.auction.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: { select: { name: true, description: true } },
        _count: { select: { AuctionBids: true } },
      },
    })
  ).map((auction) => ({
    id: auction.id,
    prices: auction.prices,
    userId: auction.userId,
    status: auction.endDate < new Date() ? "CLOSED" : "OPEN",
    endDate: auction.endDate,
    createdAt: auction.createdAt,
    bidCount: auction._count.AuctionBids,
    productId: auction.productId,
    productName: auction.product.name,
    productDescription: auction.product.description,
  }));

  return res.status(200).json({ auctions });
});

const FIVE_MINUTES = 5 * 60 * 1000;
const validateNewAuction = z.object({
  endDate: z
    .date({ coerce: true })
    // set minimum auction duration to 5 minutes
    .refine((d) => d.getTime() >= Date.now() + FIVE_MINUTES),
  startingPrice: z.number().int().min(1),
  productId: z.string(),
});

export const newAuction = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { endDate, startingPrice, productId } = validateNewAuction.parse(
    req.body
  );

  // prevent creating auction if product is already on auction
  // i.e. a previous auction is still open
  const blockingAuction = await db.auction.findFirst({
    where: { productId, endDate: { gte: new Date() } },
  });

  if (blockingAuction) {
    throw new RequestError(
      409,
      "Cannot Create Auction",
      "Product Already On Auction"
    );
  }

  const auction = await db.auction.create({
    data: {
      userId: req.user.id,
      endDate,
      prices: [startingPrice],
      productId,
    },
  });

  // add to auction end queue
  await scheduleAuctionEnd(auction.id, endDate);

  logger.info(`User ${req.user.id} created new auction ${auction.id}`);
  return res
    .status(200)
    .json({ message: "Auction Created Successfully", auctionId: auction.id });
});

const validateGetAuction = z.object({ id: z.string() });

export const getAuction = ControllerWrapper(async (req, res) => {
  const { id } = validateGetAuction.parse(req.params);
  const auction = await db.auction.findUnique({
    where: { id },
    include: {
      product: { select: { name: true, description: true } },
      AuctionBids: {
        select: { amount: true, userId: true, createdAt: true, id: true },
      },
    },
  });
  if (!auction) {
    throw new RequestError(404, "Cannot Get Auction", "Auction Not Found");
  }

  return res.status(200).json({
    id: auction.id,
    prices: auction.prices,
    status: auction.endDate < new Date() ? "CLOSED" : "OPEN",
    endDate: auction.endDate,
    createdAt: auction.createdAt,
    productId: auction.productId,
    productName: auction.product.name,
    productDescription: auction.product.description,
    bids: auction.AuctionBids,
  });
});

export const deleteAuction = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { id } = validateGetAuction.parse(req.params);
  // only delete auctions that belong to the user
  try {
    await db.auction.delete({ where: { id, userId: req.user.id } });
  } catch {
    throw new RequestError(404, "Cannot Delete Auction", "Auction Not Found");
  }

  // cancel auction end job
  await cancelScheduledAuctionEnd(id);

  logger.info(`User ${req.user.id} deleted auction ${req.user.id}`);
  return res.status(200).json({ message: "Auction Deleted Successfully" });
});
