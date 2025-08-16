import { Agent } from "../models/agent.model.js";
import { User } from "../models/user.model.js";

export function createString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function createClerkId() {
  var result = "user_";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < 25; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function createApiId() {
  return Math.floor(10000000 + Math.random() * 90000000);
}

export async function createTestUser(clerkId) {
  const user = await User.create({
    clerkId,
    email: createString(5) + "@example.com",
    fullName: createString(10),
  });
  return user;
}

export async function createTestAgent(userId, apiId) {
  const agent = await Agent.create({
    user: userId,
    apiId: apiId,
    apiHash: createString(35),
    sessionString: createString(205),
    name: "TestAgent",
    prompt: "Hello, how can I help you today?",
    typingTime: 0,
    reactionTime: 0,
    model: "gpt-3.5-turbo",
    status: "frozen",
  });
  return agent;
}
