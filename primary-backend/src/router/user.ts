import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { SigninSchema, SignupSchema } from "../types.js";
import { prismaClient } from "../db/index.js";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config.js";

const router = Router();

router.post("/signup", async (req, res) => {
    const body = req.body;
    const parsedData = SignupSchema.safeParse(body);

    if (!parsedData.success) {
        console.log(parsedData.error);
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username
        }
    });

    if (userExists) {
        return res.status(403).json({
            message: "User already exists"
        })
    }

    await prismaClient.user.create({
        data: {
            email: parsedData.data.username,
            // TODO: Dont store passwords in plaintext, hash it
            password: parsedData.data.password,
            name: parsedData.data.name
        }
    })

    // await sendEmail();

    return res.json({
        message: "Please verify your account by checking your email"
    });

})

router.post("/signin", async (req, res) => {
    const body = req.body;
    const parsedData = SigninSchema.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    });
    
    if (!user) {
        return res.status(403).json({
            message: "Sorry credentials are incorrect"
        })
    }

    // sign the jwt
    if (!JWT_PASSWORD || !JWT_PASSWORD.trim()) {
        console.error("JWT_PASSWORD is not set");
        return res.status(500).json({ message: "Server configuration error" });
    }
    const token = jwt.sign(
        { id: user.id },
        JWT_PASSWORD
    );
    if (!token || !token.trim()) {
        return res.status(500).json({ message: "Failed to create session" });
    }
    res.json({ token });
})

router.get("/user", authMiddleware, async (req, res) => {
    const id = req.id;
    if (!id) {
        return res.status(403).json({
            message: "Unauthorized"
        });
    }
    
    const user = await prismaClient.user.findFirst({
        where: {
            id: parseInt(id)
        },
        select: {
            name: true,
            email: true
        }
    });

    return res.json({
        user
    });
})

export const userRouter = router;