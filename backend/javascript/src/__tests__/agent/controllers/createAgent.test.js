import request from "supertest";
import app from "../../../../index.js";
import { connectDB } from "../../../lib/db.js";
import mongoose from "mongoose";
import { User } from "../../../models/user.model.js";
import { Agent } from "../../../models/agent.model.js";

let testUser;
let testAgent;

beforeAll(async () => {
  await connectDB();

  testUser = await User.create({
    clerkId: "12345678",
    fullName: "VladVez",
  });

  testAgent = await Agent.create({
    user: testUser._id,
    apiId: 11111111,
    name: "TestAgent",
    apiHash: "f2d89262eee8b7bacf3f95610f37409a",
    sessionString:
      "1AgAOMTQ5LjE1NC4xNjcuNTABuzpQNuvCXK+oPhl7v/Clk+SmQVUPtWUph45fk5lHFSWogH3BDwLZHnNvk7zfeR4uFvnnolS9iXstMUcbsLd/oDeEyITi0VZ++erN7mprjfLE6JVqlK5FaG1jVVncyV8rEIujssA4OfddxaMQY4UqMatEFfC6cqDGhlfZHFzQhPxBxcX599Zg0ok3Ne69H1mB2aibZRiZQQWI/pcOSA5uJm8r2xiajsbBkAy4nyRH5TI67bAc11V3icUa+V8kGkQOh6VR84rPO2wNxdWdz/xbrygxx9o1S3d28Jcqvftuea+leqDvzZjmMk5HKsj+i8QqDT09hE9r7XKKAAsULKqrPC8=",
    prompt: "You are a helpful assistant.",
    typingTime: 1,
    reactionTime: 1,
    model: "gpt-4o",
  });
});

describe("POST /api/agent/create", () => {
  it("should create the same agent for a different apiId", async () => {
    const res = await request(app)
      .post("/api/agent/create")
      .send({
        clerkId: testUser.clerkId,
        apiId: 22222222,
        name: testAgent.name,
        apiHash: testAgent.apiHash,
        sessionString: testAgent.sessionString + "2",
        prompt: testAgent.prompt,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "queued",
      type: "create_or_update_agent",
    });

    const agent = await Agent.findOne({ apiId: 22222222 });
    expect(agent).toBeTruthy();
    expect(agent.name).toBe(testAgent.name);
  });

  it("should return 400 if agent already exists", async () => {
    const res = await request(app)
      .post("/api/agent/create")
      .send({
        clerkId: testUser.clerkId,
        apiId: testAgent.apiId,
        name: testAgent.name,
        apiHash: testAgent.apiHash,
        sessionString: testAgent.sessionString + "3",
        prompt: testAgent.prompt,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Agent already exists" });
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app)
      .post("/api/agent/create")
      .send({
        clerkId: "nonexistent_clerk_id",
        apiId: 44444444,
        name: testAgent.name,
        apiHash: testAgent.apiHash,
        sessionString: testAgent.sessionString + "4",
        prompt: testAgent.prompt,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Agent.deleteMany({});
  await mongoose.connection.close();
});
