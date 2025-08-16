import request from "supertest";
import app from "../../../../index.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
  createString,
} from "../../../utils/test.utils.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import { Agent } from "../../../models/agent.model.js";

let mongoServer;

let testUser;
let testAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
  testUser = await createTestUser(createClerkId());
  testAgent = await createTestAgent(testUser._id, createApiId());
});

describe("POST /api/agent", () => {
  it("should create the same agent for a different apiId", async () => {
    const apiId = createApiId();
    const res = await request(app)
      .post("/api/agent")
      .send({
        clerkId: testUser.clerkId,
        apiId: apiId,
        apiHash: createString(35),
        sessionString: createString(205),
        prompt: testAgent.prompt,
        name: testAgent.name,
        typingTime: testAgent.typingTime,
        reactionTime: testAgent.reactionTime,
        model: testAgent.model,
        planType: "year",
      });

    expect(res.statusCode).toBe(200);

    const agent = await Agent.findOne({ apiId: apiId });
    expect(agent).toBeTruthy();
    expect(agent.name).toBe(testAgent.name);
  });

  it("should return 400 if agent already exists", async () => {
    const res = await request(app).post("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: testAgent.apiId,
      name: testAgent.name,
      apiHash: testAgent.apiHash,
      sessionString: testAgent.sessionString,
      prompt: testAgent.prompt,
      typingTime: testAgent.typingTime,
      reactionTime: testAgent.reactionTime,
      model: testAgent.model,
      planType: "year",
    });

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app)
      .post("/api/agent")
      .send({
        clerkId: createClerkId(),
        apiId: createApiId(),
        name: testAgent.name,
        apiHash: createString(30),
        sessionString: createString(200),
        prompt: testAgent.prompt,
        typingTime: testAgent.typingTime,
        reactionTime: testAgent.reactionTime,
        model: testAgent.model,
        planType: "year",
      });

    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  await disconnectTestDB();
});
