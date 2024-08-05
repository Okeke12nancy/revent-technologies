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
import {
  addProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "./controller/product";

envValidator({ PRODUCT_SERVICE_PORT: z.number({ coerce: true }) });

const app = express();
app.use(
  cors(),
  helmet(),
  cookieParser(),
  express.json(),
  morganMiddleware("PRODUCT SERVICE")
);

app.get("/health", (_, res) => res.sendStatus(200));

app.get("/products", listProducts);
app.post("/products", userAuthMiddleware, addProduct);
app.get("/products/:id", getProduct);
app.put("/products/:id", userAuthMiddleware, updateProduct);
app.delete("/products/:id", userAuthMiddleware, deleteProduct);

app.use(errorHandler);

const PORT = process.env.PRODUCT_SERVICE_PORT;
app.listen(PORT, () => {
  logger.info(`Product Service running on ${PORT}`);
});
