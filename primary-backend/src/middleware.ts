import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";

export function authMiddleware (req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || typeof authHeader !== "string") {
        return res.status(403).json({
            message: "You are not logged in"
        });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    
    try {
        const payload = jwt.verify(token, JWT_PASSWORD) as { id: string };
        req.id = payload.id;
        next();
    } catch(e) {
        return res.status(403).json({
            message: "You are not logged in"
        });
    }
}