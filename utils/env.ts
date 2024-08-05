import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });
import { z } from "zod";

export const envValidator = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).parse(process.env);
