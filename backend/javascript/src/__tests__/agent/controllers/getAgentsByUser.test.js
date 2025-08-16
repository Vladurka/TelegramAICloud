import request, { agent } from "supertest";
import app from "../../../../index.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
} from "../../../utils/test.utils.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";

let mongoServer;

let testUser;
let testAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
  testUser = await createTestUser(createClerkId());
  testAgent = await createTestAgent(testUser._id, createApiId());
});

describe("GET /api/agent/getByUser", () => {
  it("should return agents for existing user", async () => {
    const res = await request(app).get(
      "/api/agent/getByUser/" + testUser.clerkId
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      agents: [
        {
          apiId: testAgent.apiId,
          name: testAgent.name,
          status: testAgent.status,
        },
      ],
    });
  });
});

afterAll(async () => {
  await disconnectTestDB();
});
