import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
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
let frozenAgent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());

  testUser = await createTestUser(createClerkId());
  frozenAgent = await createTestAgent(testUser._id, createApiId());
});

describe("POST /api/agent/unfreeze", () => {
  it("returns 200 and calls subscription API with correct payload", async () => {
    const url = "https://payment.com";
    axiosInstance.post.mockResolvedValue({
      data: { url: url },
    });

    const body = {
      clerkId: testUser.clerkId,
      apiId: frozenAgent.apiId,
      planType: "month",
    };

    const res = await request(app).post("/api/agent/unfreeze").send(body);

    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/subscription/create",
      expect.objectContaining({
        clerkId: body.clerkId,
        containerId: body.apiId,
        planType: body.planType,
      })
    );

    expect(res.statusCode).toBe(200);
  });

  it("should return 404 if agent not found", async () => {
    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: testUser.clerkId,
      apiId: createApiId(),
      planType: "month",
    });

    expect(axiosInstance.post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: createClerkId(),
      apiId: frozenAgent.apiId,
      planType: "month",
    });

    expect(axiosInstance.post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
  });

  it("should return 500 if subscription API call fails", async () => {
    axiosInstance.post.mockRejectedValue(new Error("Subscription API error"));

    const res = await request(app).post("/api/agent/unfreeze").send({
      clerkId: testUser.clerkId,
      apiId: frozenAgent.apiId,
      planType: "month",
    });

    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(500);
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await disconnectTestDB();
});
