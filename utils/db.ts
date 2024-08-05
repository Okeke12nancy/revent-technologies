import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { redis } from "./redis";
import { logger } from "./log";

const getHashKey = (plainKey: string) => {
  const hashKey = crypto.createHash("sha256").update(plainKey).digest("hex");
  return "CACHE_ASIDE_" + hashKey;
};

const getModelSetKey = (model: string) => `CACHE_KEYS_${model}`;

// extend prisma operations with caching in redis
export const db = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const modelSetKey = getModelSetKey(model);
        // no need to cache mutation operations
        if (
          operation !== "findUnique" &&
          operation !== "findUniqueOrThrow" &&
          operation !== "findFirst" &&
          operation !== "findFirstOrThrow" &&
          operation !== "findMany" &&
          operation !== "count" &&
          operation !== "aggregate" &&
          operation !== "groupBy"
        ) {
          // clear cache for model
          const modelSet = await redis.smembers(modelSetKey);
          if (modelSet.length > 0) {
            logger.info(`CACHE CLEAR: ${model}`);
            await redis.del(...modelSet);
          }
          await redis.del(modelSetKey);
          return query(args);
        }

        const hashKey = getHashKey(JSON.stringify({ model, operation, args }));
        const cachedData = await redis.get(hashKey);

        if (cachedData) {
          logger.info(`CACHE HIT: ${model}.${operation}`);
          return JSON.parse(cachedData);
        }

        const data = await query(args);
        await redis.set(hashKey, JSON.stringify(data), "EX", 60);
        await redis.sadd(modelSetKey, hashKey);
        await redis.expire(modelSetKey, 60); // set/extend cache for 60 seconds
        logger.info(`CACHE ASIDE: ${model}.${operation}`);
        return data;
      },
    },
  },
});
