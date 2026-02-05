import "dotenv/config";
import { Kafka } from "kafkajs";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TOPIC_NAME = "zap-events"


const kafka = new Kafka({
    clientId: "outbox-processor",
    brokers: ["localhost:9092"],
});



async function main() {
const producer = kafka.producer();
await producer.connect();


while (1) {
 const pendingRows =  await prisma.zapRunOutbox.findMany({
  where: {},
  take: 10
 });

pendingRows.forEach(r => {
    producer.send({
        topic: TOPIC_NAME,
        messages:
            pendingRows.map(r => ({
                value: r.zapRunId,
            }))
        
    });
})


await prisma.zapRunOutbox.deleteMany({
    where: {
        id: {
  in: pendingRows.map(r => r.id)
        }
    }
})

}
}

main().catch(console.error);