import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();
interface CustomRequest extends Request {
  user?: any;
}

const verifyToken = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided!" });
  }
  try {
    //@ts-ignore
    const user = jwt.verify(token, process.env.JWT_KEY);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token!" });
  }
};

export default verifyToken;
