import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError } from "../../../../utils/errors";
import b from "bcrypt";
import { formatTokenCookie } from "../../../../utils/tokenCookie";
import { JWT } from "../../../../utils/jwt";
import { nameValidator, passwordValidator } from "../../../../utils/validators";

const validateRegisterUser = z.object({
  name: nameValidator,
  email: z.string().email(),
  password: passwordValidator,
});

export const registerUser = ControllerWrapper(async (req, res) => {
  const { name, email, password } = validateRegisterUser.parse(req.body);

  const check = await db.user.findUnique({ where: { email } });
  if (check) {
    throw new RequestError(
      409,
      "User Registration Failed",
      "Email Already In Use"
    );
  }

  const hashedPassword = await b.hash(password, 10);

  const user = await db.user.create({
    data: { name, email, password: hashedPassword },
  });

  const token = JWT.sign(user.id, "30d");
  return res
    .setHeader("Set-Cookie", formatTokenCookie(token))
    .status(201)
    .json({ message: "User Registration Successful" });
});

const validateLoginUser = z.object({
  email: z.string().email(),
  password: passwordValidator,
});

export const loginUser = ControllerWrapper(async (req, res) => {
  const { email, password } = validateLoginUser.parse(req.body);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    throw new RequestError(401, "Login Failed", "Invalid Email or Password");
  }

  const match = await b.compare(password, user.password);
  if (!match) {
    throw new RequestError(401, "Login Failed", "Invalid Email or Password");
  }

  const token = JWT.sign(user.id, "30d");
  return res
    .setHeader("Set-Cookie", formatTokenCookie(token))
    .status(200)
    .json({ message: "Login Successful" });
});
