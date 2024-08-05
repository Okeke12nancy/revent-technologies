import { db } from "../../../../utils/db";
import { logger } from "../../../../utils/log";

export const processAuctionOrder = async (auctionId: string) => {
  const auction = await db.auction.findUnique({
    where: { id: auctionId },
    include: {
      _count: { select: { AuctionBids: true } },
      product: true,
    },
  });
  if (!auction) {
    logger.error(`Auction ${auctionId} not found`);
    return;
  }

  if (auction.endDate.getTime() >= Date.now()) {
    logger.info(`Auction ${auctionId} not yet ended`);
    return;
  }

  if (auction._count.AuctionBids === 0) {
    logger.info(`Auction ${auctionId} ended with no bids`);
    return;
  }

  const [winningBid] = await db.auctionBid.findMany({
    where: { auctionId },
    orderBy: { amount: "desc" },
    take: 1,
  });

  const order = await db.order.create({
    data: {
      userId: winningBid.userId,
      productId: auction.productId,
      auctionBidId: winningBid.id,
      auctionId: auction.id,
    },
  });

  logger.info(`Order ${order.id} created for auction ${auctionId}`);
  return;
};
