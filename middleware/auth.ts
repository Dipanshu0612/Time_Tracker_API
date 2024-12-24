import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided!" });
  }
  try {
    jwt.verify(token, process.env.JWT_KEY);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token!" });
  }
};

export default verifyToken;
