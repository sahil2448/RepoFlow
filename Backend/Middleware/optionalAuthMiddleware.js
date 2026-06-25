import jwt from "jsonwebtoken";

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next(); // guest — proceed with no userId

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.SECRET_KEY,
    );
    req.userId = decoded.id || decoded.userId || decoded._id;
  } catch {
    // invalid/expired token — still proceed as guest, don't block
  }
  next();
}
