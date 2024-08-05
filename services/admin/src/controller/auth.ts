import { z } from "zod";
import { ControllerWrapper } from "../../../../middleware/error";
import { db } from "../../../../utils/db";
import { RequestError } from "../../../../utils/errors";
import b from "bcrypt";
import { formatTokenCookie } from "../../../../utils/tokenCookie";
import { JWT } from "../../../../utils/jwt";
import { passwordValidator } from "../../../../utils/validators";

const validateLoginAdmin = z.object({
  email: z.string().email(),
  password: passwordValidator,
});

export const loginAdmin = ControllerWrapper(async (req, res) => {
  const { email, password } = validateLoginAdmin.parse(req.body);

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
