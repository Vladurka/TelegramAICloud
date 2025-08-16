import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import { Agent } from "../../../models/agent.model.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
  createString,
} from "../../../utils/test.utils.js";
import { expect, jest } from "@jest/globals";

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
  testUser = await createTestUser(createClerkId());
  testAgent = await createTestAgent(testUser._id, createApiId());
});

describe("POST /api/agent", () => {
  it("should create the same agent for a different apiId", async () => {
    const url = "https://payment.com";
    axiosInstance.post.mockResolvedValue({
      data: { url: url },
    });

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

    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/subscription/create",
      expect.objectContaining({
        clerkId: testUser.clerkId,
        containerId: apiId,
        planType: "year",
      })
    );

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

    expect(axiosInstance.post).not.toHaveBeenCalled();
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

    expect(axiosInstance.post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
  });

  it("rolls back agent if subscription API fails", async () => {
    const apiId = createApiId();
    axiosInstance.post.mockRejectedValue(new Error("Subscription API error"));

    const res = await request(app)
      .post("/api/agent")
      .send({
        clerkId: testUser.clerkId,
        apiId,
        name: testAgent.name,
        apiHash: createString(30),
        sessionString: createString(200),
        prompt: testAgent.prompt,
        typingTime: testAgent.typingTime,
        reactionTime: testAgent.reactionTime,
        model: testAgent.model,
        planType: "year",
      });

    expect(res.statusCode).toBe(500);
    expect(axiosInstance.post).toHaveBeenCalledTimes(1);

    const rolledBack = await Agent.findOne({ apiId });
    expect(rolledBack).toBeNull();
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});
