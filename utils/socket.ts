import { redis } from "./redis";
import type http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

interface ServerToClientEvents {
  "auction:changed": (id: string) => void;
}

interface ClientToServerEvents {
  "auction:listen": (id: string) => void;
  "auction:unlisten": (id: string) => void;
}

interface InterServerEvents {
  [k: string]: (...args: unknown[]) => void;
}

interface SocketData {
  [k: string]: unknown;
}

const redisDup = redis.duplicate();
export const createSocketIoRedis = (server: http.Server) =>
  new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, { adapter: createAdapter(redis, redisDup) });
