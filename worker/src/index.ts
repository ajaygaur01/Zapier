import { Kafka } from "kafkajs";
const TOPIC_NAME = "zap-events"
const kafka = new Kafka({
    clientId: "worker",
    brokers: ["localhost:9092"],
});


async function main() { 
    const consumer = kafka.consumer({ groupId: "main-worker" });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

    await consumer.run({
        autoCommit: false,
       eachMessage: async ({topic, partition, message}) => {
       console.log({topic,
        partition,
        offset: message.offset,
        value: message.value?.toString(),
       });
       await new Promise(resolve => setTimeout(resolve, 5000));
       await consumer.commitOffsets([
       {
        topic: topic,
        partition: partition,
        offset: (parseInt(message.offset) + 1).toString(),
       }
       ])
       }
    });
    
}
main().catch(console.error);