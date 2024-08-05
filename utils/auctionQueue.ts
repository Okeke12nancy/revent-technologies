import Queue from "bull";
import { logger } from "./log";

export const auctionEndQueue = new Queue<{ auctionId: string }>(
  "auctionQueue",
  {
    redis: {
      port: process.env.REDIS_PORT as unknown as number,
      host: process.env.REDIS_HOST,
    },
  }
);

export const scheduleAuctionEnd = async (auctionId: string, endDate: Date) => {
  await auctionEndQueue.add(
    { auctionId },
    {
      jobId: auctionId,
      delay: endDate.getTime() - Date.now(),
    }
  );
  logger.info(`Scheduled auction ${auctionId} to end at ${endDate}`);
};

export const cancelScheduledAuctionEnd = async (auctionId: string) => {
  const job = await auctionEndQueue.getJob(auctionId);
  if (job) {
    await job.remove();
  }
  logger.info(`Cancelled scheduled auction end ${auctionId}`);
};
