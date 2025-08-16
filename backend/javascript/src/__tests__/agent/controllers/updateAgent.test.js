import request from "supertest";
import app from "../../../../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
} from "../../../utils/test.utils.js";
import { User } from "../../../models/user.model.js";
import { Agent } from "../../../models/agent.model.js";

let mongoServer;
let user;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
});

beforeEach(async () => {
  await Agent.deleteMany({});
  await User.deleteMany({});

  user = await createTestUser(createClerkId());
  agent = await createTestAgent(user._id, createApiId());
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("UPDATE /api/agent", () => {
  it("should update agent and return queued status", async () => {
    const newName = "Updated Name";
    const newPrompt = "Updated prompt text";
    const newTyping = 3;
    const newReaction = 5;
    const newModel = "gpt-3.5-turbo";

    const res = await request(app).put("/api/agent").send({
      clerkId: user.clerkId,
      apiId: agent.apiId,
      name: newName,
      prompt: newPrompt,
      typingTime: newTyping,
      reactionTime: newReaction,
      model: newModel,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: "queued",
      type: "create_or_update_agent",
    });

    const updated = await Agent.findOne({ _id: agent._id });
    expect(updated).toBeTruthy();
    expect(updated.name).toBe(newName.trim());
    expect(updated.prompt).toBe(newPrompt.trim());
    expect(updated.typingTime).toBe(newTyping);
    expect(updated.reactionTime).toBe(newReaction);
    expect(updated.model).toBe(newModel.trim());
  });

  it("should return 404 when user not found", async () => {
    const res = await request(app).put("/api/agent").send({
      clerkId: createClerkId(),
      apiId: agent.apiId,
      name: "NewTestAgent",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: "User not found" });
  });

  it("should return 404 when agent not found", async () => {
    const res = await request(app).put("/api/agent").send({
      clerkId: user.clerkId,
      apiId: createApiId(),
      name: "NewTest Agent",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: "Agent not found" });
  });
});
