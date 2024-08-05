import express from "express";
import { envValidator } from "../../../utils/env";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "../../../utils/log";
import { morganMiddleware } from "../../../middleware/morgan";
import { userAuthMiddleware } from "../../../middleware/userAuth";
import { errorHandler } from "../../../middleware/error";
import { auctionEndQueue } from "../../../utils/auctionQueue";
import { processAuctionOrder } from "./controller/processAuction";
import { getOrder, listOrders } from "./controller/order";

envValidator({ ORDER_SERVICE_PORT: z.number({ coerce: true }) });

const app = express();
app.use(
  cors(),
  helmet(),
  cookieParser(),
  express.json(),
  morganMiddleware("ORDER SERVICE")
);

app.get("/health", (_, res) => res.sendStatus(200));

app.get("/orders", userAuthMiddleware, listOrders);
app.get("/orders/:id", userAuthMiddleware, getOrder);

auctionEndQueue.process(async (job) => {
  logger.info(`Auction ${job.data} has ended`);
  await processAuctionOrder(job.data.auctionId);
});

app.use(errorHandler);

const PORT = process.env.ORDER_SERVICE_PORT;
app.listen(PORT, () => {
  logger.info(`Order Service running on ${PORT}`);
});
