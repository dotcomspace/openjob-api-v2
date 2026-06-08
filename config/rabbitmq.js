const amqp = require('amqplib');

const RABBITMQ_URL = process.env.AMQP_URL ||
  `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

const QUEUE_NAME = 'application_notifications';

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('RabbitMQ terhubung! Queue:', QUEUE_NAME);
    return channel;
  } catch (error) {
    console.error('RabbitMQ connection error:', error.message);
    throw error;
  }
};

const getChannel = () => channel;

const publishMessage = async (queue, message) => {
  if (!channel) await connectRabbitMQ();
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
  console.log('Message published to queue:', queue, message);
};

module.exports = { connectRabbitMQ, getChannel, publishMessage, QUEUE_NAME };
