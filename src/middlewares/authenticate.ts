/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request{
    userId: string;
}


const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get("Authorization"); 

  if (!authHeader) {
    return next(createHttpError(401, "Authorization token is required"));
  }

  const parsedToken = authHeader.split(" ")[1]; 

  if (!parsedToken) {
    return next(createHttpError(401, "Invalid authorization format. Use Bearer <token>"));
  }

  try {
    const decoded = verify(parsedToken, config.jwtSecret as string);
  
    const _req= req as AuthRequest;

    _req.userId = decoded.sub as string;


    return next();
  } catch {
    return next(createHttpError(401, "Invalid or expired token"));
  }
};


export default authenticate;
