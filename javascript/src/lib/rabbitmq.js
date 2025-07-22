import amqp from "amqplib";
import { RabbitMQNotConnectedError } from "../errors/RabbitMQNotConnectedError.js";

let connection;
let channel;

export const connectRabbitMQ = async (
  url = "amqp://guest:guest@localhost:5672"
) => {
  if (connection) return channel;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    console.log("✅ Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    throw error;
  }
};

export const sendToQueue = async (queueName, message) => {
  if (!channel) {
    throw new RabbitMQNotConnectedError(
      "Channel is not connected. Call connectRabbitMQ() first."
    );
  }

  await channel.assertQueue(queueName, { durable: true });

  const payload = Buffer.from(
    typeof message === "string" ? message : JSON.stringify(message)
  );

  channel.sendToQueue(queueName, payload, { persistent: true });
  console.log(`📨 Message sent to [${queueName}]:`, message);
};

export const closeConnection = async () => {
  await channel?.close();
  await connection?.close();
  console.log("🛑 Channel and connection closed");
};
