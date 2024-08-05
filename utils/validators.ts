import { z } from "zod";

export const nameValidator = z
  .string()
  .min(5)
  .max(30)
  .regex(/^[a-zA-Z_\- ]+$/);

export const passwordValidator = z.string().min(8).max(64);
