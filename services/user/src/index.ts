import express from "express";
import { envValidator } from "../../../utils/env";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "../../../utils/log";
import { morganMiddleware } from "../../../middleware/morgan";
import { loginUser, registerUser } from "./controller/auth";
import { getProfile, updateProfile } from "./controller/profile";
import { errorHandler } from "../../../middleware/error";

envValidator({ USER_SERVICE_PORT: z.number({ coerce: true }) });

const app = express();
app.use(
  cors(),
  helmet(),
  cookieParser(),
  express.json(),
  morganMiddleware("USER SERVICE")
);

app.get("/health", (_, res) => res.sendStatus(200));
app.post("/users/register", registerUser);
app.post("/users/login", loginUser);
app.get("/users/profile", getProfile);
app.put("/users/profile", updateProfile);

app.use(errorHandler);

const PORT = process.env.USER_SERVICE_PORT;
app.listen(PORT, () => {
  logger.info(`User Service running on ${PORT}`);
});
