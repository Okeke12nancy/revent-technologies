import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import {
  InternalServerError,
  RequestError,
  UnauthorizedError,
} from "../../../../utils/errors";
import { logger } from "../../../../utils/log";
import { io } from "..";

const validateNewAuctionBid = z.object({
  id: z.string(),
  amount: z.number().int().min(1),
});

export const newAuctionBid = ControllerWrapper(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError("User not found");
  }

  const { id: auctionId, amount } = validateNewAuctionBid.parse(
    Object.assign(req.body, req.params)
  );

  const auction = await db.auction.findUnique({ where: { id: auctionId } });
  if (!auction) {
    throw new RequestError(404, "Cannot Bid on Auction", "Auction Not Found");
  }

  if (auction.userId === req.user.id) {
    throw new RequestError(
      400,
      "Cannot Bid on Auction",
      "Cannot Bid on Your Own Auction"
    );
  }

  if (auction.endDate < new Date()) {
    throw new RequestError(400, "Cannot Bid on Auction", "Auction Closed");
  }

  const currentPrice = auction.prices.at(-1);
  if (currentPrice === undefined) {
    throw new InternalServerError(
      `Missing starting price for auction ${auctionId}`
    );
  }

  if (currentPrice !== undefined && amount <= currentPrice) {
    throw new RequestError(400, "Cannot Bid on Auction", "Invalid Bid Amount");
  }

  const bid = await db.auctionBid.create({
    data: {
      amount,
      userId: req.user.id,
      auctionId: auctionId,
    },
  });

  // update auction prices
  await db.auction.update({
    where: { id: auctionId },
    data: {
      prices: { push: amount },
    },
  });

  // emit "changed" event to all sockets connected to the auction room
  io.to(auctionId).emit("auction:changed", auctionId);

  logger.info(`User ${req.user.id} bid (${bid.id}) on auction ${auctionId}`);
  return res
    .status(200)
    .json({ message: "Auction Bid Created Successfully", bidId: bid.id });
});
