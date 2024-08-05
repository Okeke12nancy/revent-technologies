import morgan from "morgan";
import { logger } from "../utils/log";

const stream = {
  write: (message: string) => logger.info(message.split("\n")[0]),
};

export const morganMiddleware = (serviceName: string) =>
  morgan(
    `[${serviceName}] :remote-addr :method :url :status :res[content-length] - :response-time ms`,
    { stream }
  );
