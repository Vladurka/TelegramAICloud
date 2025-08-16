import request from "supertest";
import app from "../../../../index.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectTestDB, disconnectTestDB } from "../../../lib/testDb.js";
import {
  createClerkId,
  createApiId,
  createTestUser,
  createTestAgent,
  createString,
} from "../../../utils/test.utils.js";
import { Subscription } from "../../../models/subscription.model.js";

let mongoServer;
let user;
let agent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectTestDB(mongoServer.getUri());
  user = await createTestUser(createClerkId());
  agent = await createTestAgent(user._id, createApiId());
});

describe("GET /api/agent/:clerkId/:apiId", () => {
  it("returns 200 with planType when active subscription exists", async () => {
    await Subscription.create({
      user: user._id,
      containerId: agent.apiId,
      stripeSubscriptionId: createString(15),
      planType: "year",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "active",
    });

    const res = await request(app).get(
      `/api/agent/${agent.apiId}/${user.clerkId}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      agent: {
        name: agent.name,
        status: agent.status,
        prompt: agent.prompt,
        typingTime: agent.typingTime,
        reactionTime: agent.reactionTime,
        model: agent.model,
        planType: "year",
      },
    });
  });

  it("returns 200 without planType when no active subscription", async () => {
    const res = await request(app).get(
      `/api/agent/${agent.apiId}/${user.clerkId}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      agent: {
        name: agent.name,
        status: agent.status,
        prompt: agent.prompt,
        typingTime: agent.typingTime,
        reactionTime: agent.reactionTime,
        model: agent.model,
      },
    });
    expect(res.body.agent.planType).toBeUndefined();
  });

  it("returns 404 when user not found", async () => {
    const res = await request(app).get(
      `/api/agent/${agent.apiId}/${createClerkId()}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: "User not found" });
  });

  it("returns 404 when agent not found", async () => {
    const res = await request(app).get(
      `/api/agent/${createApiId()}/${user.clerkId}`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ error: "Agent not found" });
  });
});

afterEach(async () => {
  await Subscription.deleteMany({});
});

afterAll(async () => {
  await disconnectTestDB();
});
