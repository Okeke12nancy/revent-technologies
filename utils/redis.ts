import Redis from "ioredis";
import { envValidator } from "./env";
import { z } from "zod";

envValidator({
  REDIS_PORT: z.number({ coerce: true }),
  REDIS_HOST: z.string(),
});

export const redis = new Redis({
  port: process.env.REDIS_PORT as unknown as number,
  host: process.env.REDIS_HOST,
});
