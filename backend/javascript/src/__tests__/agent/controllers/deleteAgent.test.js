import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
} from "../../../utils/test.utils.js";
import { Agent } from "../../../models/agent.model.js";
import { User } from "../../../models/user.model.js";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../../lib/axios.js", () => {
  return {
    axiosInstance: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };
});

const { axiosInstance } = await import("../../../lib/axios.js");
const { default: app } = await import("../../../../index.js");

let mongoServer;
let testUser;
let testAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
});

beforeEach(async () => {
  await Agent.deleteMany({});
  await User.deleteMany({});

  testUser = await createTestUser(createClerkId());
  testAgent = await createTestAgent(testUser._id, createApiId());
});

describe("DELETE /api/agent", () => {
  it("should delete an agent for existing user and cancel subscription", async () => {
    axiosInstance.post.mockResolvedValue({ data: { ok: true } });

    const res = await request(app).delete("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: testAgent.apiId,
    });

    expect(res.statusCode).toBe(200);

    const agent = await Agent.findOne({ apiId: testAgent.apiId });
    expect(agent).toBeNull();

    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/subscription/cancel",
      expect.objectContaining({
        containerId: testAgent.apiId,
        clerkId: testUser.clerkId,
      })
    );
  });

  it("should roll back agent when subscription cancel fails and return 500", async () => {
    axiosInstance.post.mockRejectedValue(new Error("cancel failed"));

    const before = await Agent.findOne({ apiId: testAgent.apiId });
    expect(before).toBeTruthy();

    const res = await request(app).delete("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: testAgent.apiId,
    });

    expect(res.statusCode).toBe(500);
    expect(axiosInstance.post).toHaveBeenCalledTimes(1);

    const after = await Agent.findOne({ apiId: testAgent.apiId });
    expect(after).toBeTruthy();
  });

  it("should return 404 if user not found and not call external API", async () => {
    const res = await request(app).delete("/api/agent").send({
      clerkId: createClerkId(),
      apiId: testAgent.apiId,
    });

    expect(res.statusCode).toBe(404);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it("should return 404 if agent not found and not call external API", async () => {
    const res = await request(app).delete("/api/agent").send({
      clerkId: testUser.clerkId,
      apiId: createApiId(),
    });

    expect(res.statusCode).toBe(404);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it("should return 400 when apiId/clerkId are missing", async () => {
    const res = await request(app).delete("/api/agent").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: "apiId and clerkId are required" });
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});
