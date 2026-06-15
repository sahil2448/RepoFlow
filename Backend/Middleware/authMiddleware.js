import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY =
  process.env.JWT_SECRET || process.env.SECRET_KEY || "repoflow_default_secret";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Authorization token missing" });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    if (!payload || typeof payload !== "object" || !payload.id) {
      return res.status(401).json({ error: "Invalid authorization token" });
    }

    const userId = String(payload.id);
    req.userId = userId;
    req.user = { id: userId };
    req.session = { userId };

    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid or expired token" });
  }
}
