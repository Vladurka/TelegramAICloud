import request from "supertest";
import app from "../../../../index.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
} from "../../../utils/test.utils.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import { Agent } from "../../../models/agent.model.js";
import { User } from "../../../models/user.model.js";

let mongoServer;

let testUser;
let testAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
});

beforeEach(async () => {
  testUser = await createTestUser(createClerkId());
  testAgent = await createTestAgent(testUser._id, createApiId());
});

describe("DELETE /api/agent", () => {
  it("should delete an agent for existing user", async () => {
    const res = await request(app).delete("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: testAgent.apiId,
    });

    expect(res.statusCode).toBe(200);

    const agent = await Agent.findOne({ apiId: testAgent.apiId });

    expect(agent).toBeNull();
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app).delete("/api/agent").send({
      clerkId: createClerkId(),
      apiId: testAgent.apiId,
    });

    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if agent not found", async () => {
    const res = await request(app).delete("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: createApiId(),
    });

    expect(res.statusCode).toBe(404);
  });
});

afterEach(async () => {
  await Agent.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  await disconnectTestDB();
});
