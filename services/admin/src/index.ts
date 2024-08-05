import express from "express";
import { envValidator } from "../../../utils/env";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "../../../utils/log";
import { morganMiddleware } from "../../../middleware/morgan";
import { loginAdmin } from "./controller/auth";
import { deleteUser, listUsers, updateUser } from "./controller/user";
import { errorHandler } from "../../../middleware/error";
import { adminAuthMiddleware } from "./middleware/auth";
import {
  updateProduct,
  listProducts,
  deleteProduct,
} from "./controller/products";

envValidator({ ADMIN_SERVICE_PORT: z.number({ coerce: true }) });

const app = express();
app.use(
  cors(),
  helmet(),
  cookieParser(),
  express.json(),
  morganMiddleware("ADMIN SERVICE")
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin: {
        id: string;
        email: string;
        password: string;
        name: string;
        createdAt: Date;
      };
    }
  }
}

app.get("/health", (_, res) => res.sendStatus(200));

// only login for admins no registration
app.get("/admin/login", loginAdmin);

app.get("/admin/users", adminAuthMiddleware, listUsers);
app.put("/admin/users/:id", adminAuthMiddleware, updateUser);
app.delete("/admin/users/:id", adminAuthMiddleware, deleteUser);
app.get("/admin/products", adminAuthMiddleware, listProducts);
app.put("/admin/products/:id", adminAuthMiddleware, updateProduct);
app.delete("/admin/products/:id", adminAuthMiddleware, deleteProduct);

app.use(errorHandler);

const PORT = process.env.ADMIN_SERVICE_PORT;
app.listen(PORT, () => {
  logger.info(`Admin Service running on ${PORT}`);
});
