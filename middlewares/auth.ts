import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { Socket } from "socket.io";
import User from "../models/user";

interface AuthenticatedRequest extends Request {
  userID?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: any;
}

interface DecodedToken extends JwtPayload {
  _id: string;
}

/**
 * Middleware to authenticate normal HTTP requests
 */
export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Bearer token header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ status: "error", message: "Please login first" });
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    req.userID = decoded._id;
    next();
  } catch (error: any) {
    res
      .status(401)
      .json({ status: "error", message: error.message || "Invalid token" });
  }
};

/**
 * Middleware to authenticate socket connections
 */
export const socketAuthenticator = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    // Extract token from socket handshake query
    const token = socket.handshake.query.userToken as string;

    if (!token) {
      return next(new Error("Please login to access this socket"));
    }

    // Verify and decode JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    const user = await User.findById(decoded._id);

    if (!user) {
      return next(new Error("User not found. Please login again"));
    }

    socket.user = user;
    next();
  } catch (error: any) {
    next(new Error(error.message));
  }
};
