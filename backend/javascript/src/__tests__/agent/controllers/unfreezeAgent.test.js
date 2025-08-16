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

let mongoServer;
let testUser;
let frozenAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());

  testUser = await createTestUser(createClerkId());
  frozenAgent = await createTestAgent(testUser._id, createApiId());
});

describe("POST /api/agent/unfreeze", () => {
  it("should return 200 in test env without calling axios", async () => {
    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: testUser.clerkId,
      apiId: frozenAgent.apiId,
      planType: "month",
    });

    expect(res.statusCode).toBe(200);
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: createClerkId(),
      apiId: frozenAgent.apiId,
      planType: "month",
    });

    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if agent not found", async () => {
    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: testUser.clerkId,
      apiId: createApiId(),
      planType: "month",
    });

    expect(res.statusCode).toBe(404);
  });
});

afterAll(async () => {
  await disconnectTestDB();
});
