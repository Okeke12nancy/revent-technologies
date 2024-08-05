import http from "http";
import express from "express";
import { envValidator } from "../../../utils/env";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "../../../utils/log";
import { morganMiddleware } from "../../../middleware/morgan";
import { errorHandler } from "../../../middleware/error";
import { userAuthMiddleware } from "../../../middleware/userAuth";
import { createSocketIoRedis } from "../../../utils/socket";
import {
  deleteAuction,
  getAuction,
  listAuctions,
  newAuction,
} from "./controller/auction";
import { newAuctionBid } from "./controller/bid";

envValidator({ AUCTION_SERVICE_PORT: z.number({ coerce: true }) });

const app = express();
const server = http.createServer(app);
export const io = createSocketIoRedis(server);

app.use(
  cors(),
  helmet(),
  cookieParser(),
  express.json(),
  morganMiddleware("AUCTION SERVICE")
);

app.get("/health", (_, res) => res.sendStatus(200));

app.post("/auctions", userAuthMiddleware, newAuction);
app.get("/auctions", listAuctions);
app.get("/auctions/:id", getAuction);
app.delete("/auctions/:id", userAuthMiddleware, deleteAuction);
app.post("/auctions/:id/bids", userAuthMiddleware, newAuctionBid);

app.use(errorHandler);

io.on("connection", (socket) => {
  socket.on("auction:listen", (id) => {
    socket.join(id);
    socket.on("auction:unlisten", () => {
      socket.leave(id);
    });
  });
});

const PORT = process.env.AUCTION_SERVICE_PORT;
server.listen(PORT, () => {
  logger.info(`Auction Service running on ${PORT}`);
});
