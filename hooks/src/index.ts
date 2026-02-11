import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import express from "express";
import { PrismaClient } from "./generated/prisma-new/client.js";

// Load environment variables from .env file
// Get the directory of the current file (hooks/src) and go up to hooks directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "..", ".env") });

// Log which DB we're using (password redacted)
const dbUrl = process.env.DATABASE_URL;
const dbForLog = dbUrl ? dbUrl.replace(/:[^:@]+@/, ":****@") : "(not set)";
console.log("DATABASE_URL (hooks):", dbForLog);

const app = express();
const prisma = new PrismaClient();

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/hooks/catch/:userId/:zapId", async (req: any, res: any) => {
    const { userId, zapId } = req.params;
    const body = req.body;

    try {
        // All raw SQL in one transaction - no Prisma ORM for writes
        const runId = crypto.randomUUID();
        const outboxId = crypto.randomUUID();
        const metadataJson = JSON.stringify(body ?? {});

        await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`INSERT INTO "ZapRun" (id, metadata, "zapId") VALUES (${runId}, ${metadataJson}::jsonb, ${zapId})`;
            await tx.$executeRaw`INSERT INTO "ZapRunOutbox" (id, "zapRunId") VALUES (${outboxId}, ${runId})`;
        });

        // Verify the row exists immediately after commit (same connection pool)
        const verified = await prisma.$queryRaw<
            Array<{ id: string; zapRunId: string }>
        >`SELECT id, "zapRunId" FROM "ZapRunOutbox" WHERE id = ${outboxId}`;

        console.log("zapRunOutbox created (raw)", runId, outboxId);
        res.status(200).json({
            success: true,
            runId,
            outboxId,
            verifiedInDb: verified.length > 0,
            dbUrl: dbForLog,
        });
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : String(error),
        });
    }
});

// Debug: see what's actually in the DB (Prisma + raw SQL)
app.get("/hooks/debug/outbox", async (_req: any, res: any) => {
    try {
        const outboxCount = await prisma.zapRunOutbox.count();
        const zapRunCount = await prisma.zapRun.count();
        const rows = await prisma.zapRunOutbox.findMany({
            take: 20,
            orderBy: { id: "desc" },
            include: { zapRun: { select: { id: true, zapId: true } } },
        });
        // Bypass Prisma: raw SQL to see actual table contents
        const rawRows = await prisma.$queryRaw<
            Array<{ id: string; zapRunId: string }>
        >`SELECT id, "zapRunId" FROM "ZapRunOutbox"`;
        const schemaInfo = await prisma.$queryRaw<
            Array<{ current_schema: string; search_path: string }>
        >`SELECT current_schema(), current_setting('search_path') AS search_path`;
        res.json({
            table: "ZapRunOutbox (PostgreSQL: \"ZapRunOutbox\" with quotes)",
            zapRunCount,
            outboxCountViaPrisma: outboxCount,
            outboxCountRaw: rawRows.length,
            schemaInfo: schemaInfo[0],
            rawRows,
            rows,
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
});

const PORT = Number(process.env.PORT) || 3002;
app.listen(PORT, () => {
    console.log(`Hooks server running on http://localhost:${PORT}`);
});