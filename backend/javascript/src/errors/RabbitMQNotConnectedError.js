export const RabbitMQNotConnectedError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RabbitMQNotConnectedError";
    Error.captureStackTrace(this, RabbitMQNotConnectedError);
  }
};
