import request from "supertest";
import app from "../../../../index.js";
import { connectDB } from "../../../lib/db.js";
import mongoose from "mongoose";
import { User } from "../../../models/user.model.js";
import { Agent } from "../../../models/agent.model.js";

beforeAll(async () => {
  await connectDB();
});

describe("POST /api/agent/create", () => {
  it("should create an agent for existing user", async () => {
    const user = await User.create({
      clerkId: "12345678",
      fullName: "VladVez",
    });

    const res = await request(app).post("/api/agent/create").send({
      clerkId: user.clerkId,
      apiId: 23454412,
      name: "TestAgent",
      apiHash: "f2d89262eee8b7bacf3f95610f37409a",
      sessionString:
        "1AgAOMTQ5LjE1NC4xNjcuNTABuzpQNuvCXK+oPhl7v/Clk+SmQVUPtWUph45fk5lHFSWogH3BDwLZHnNvk7zfeR4uFvnnolS9iXstMUcbsLd/oDeEyITi0VZ++erN7mprjfLE6JVqlK5FaG1jVVncyV8rEIujssA4OfddxaMQY4UqMatEFfC6cqDGhlfZHFzQhPxBxcX599Zg0ok3Ne69H1mB2aibZRiZQQWI/pcOSA5uJm8r2xiajsbBkAy4nyRH5TI67bAc11V3icUa+V8kGkQOh6VR84rPO2wNxdWdz/xbrygxx9o1S3d28Jcqvftuea+leqDvzZjmMk5HKsj+i8QqDT09hE9r7XKKAAsULKqrPC8=",
      prompt: "You are a helpful assistant.",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "queued",
      type: "create_or_update_agent",
    });

    const agent = await Agent.findOne({ apiId: 23454412 });

    expect(agent).toBeTruthy();
    expect(agent.name).toBe("TestAgent");

    await User.deleteMany({});
    await Agent.deleteMany({});
  });

  it("should return 404 if user not found", async () => {
    const res = await request(app).post("/api/agent/create").send({
      clerkId: "nonexistent_clerk_id",
      apiId: 23454412,
      name: "TestAgent",
      apiHash: "f2d89262eee8b7bacf3f95610f37409a",
      sessionString:
        "1AgAOMTQ5LjE1NC4xNjcuNTABuzpQNuvCXK+oPhl7v/Clk+SmQVUPtWUph45fk5lHFSWogH3BDwLZHnNvk7zfeR4uFvnnolS9iXstMUcbsLd/oDeEyITi0VZ++erN7mprjfLE6JVqlK5FaG1jVVncyV8rEIujssA4OfddxaMQY4UqMatEFfC6cqDGhlfZHFzQhPxBxcX599Zg0ok3Ne69H1mB2aibZRiZQQWI/pcOSA5uJm8r2xiajsbBkAy4nyRH5TI67bAc11V3icUa+V8kGkQOh6VR84rPO2wNxdWdz/xbrygxx9o1S3d28Jcqvftuea+leqDvzZjmMk5HKsj+i8QqDT09hE9r7XKKAAsULKqrPC8=",
      prompt: "You are a helpful assistant.",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "User not found" });
  });

  it("should return 400 if agent already exists", async () => {
    const user = await User.create({
      clerkId: "12345678",
      fullName: "VladVez",
    });

    await Agent.create({
      user: user._id,
      apiId: 23454412,
      name: "TestAgent",
      apiHash: "f2d89262eee8b7bacf3f95610f37409a",
      sessionString:
        "1AgAOMTQ5LjE1NC4xNjcuNTABuzpQNuvCXK+oPhl7v/Clk+SmQVUPtWUph45fk5lHFSWogH3BDwLZHnNvk7zfeR4uFvnnolS9iXstMUcbsLd/oDeEyITi0VZ++erN7mprjfLE6JVqlK5FaG1jVVncyV8rEIujssA4OfddxaMQY4UqMatEFfC6cqDGhlfZHFzQhPxBxcX599Zg0ok3Ne69H1mB2aibZRiZQQWI/pcOSA5uJm8r2xiajsbBkAy4nyRH5TI67bAc11V3icUa+V8kGkQOh6VR84rPO2wNxdWdz/xbrygxx9o1S3d28Jcqvftuea+leqDvzZjmMk5HKsj+i8QqDT09hE9r7XKKAAsULKqrPC8=",
      prompt: "You are a helpful assistant.",
      typingTime: 1,
      reactionTime: 1,
      model: "gpt-4o",
    });

    const res = await request(app).post("/api/agent/create").send({
      clerkId: user.clerkId,
      apiId: 23454412,
      name: "TestAgent",
      apiHash: "f2d89262eee8b7bacf3f95610f37409a",
      sessionString:
        "1AgAOMTQ5LjE1NC4xNjcuNTABuzpQNuvCXK+oPhl7v/Clk+SmQVUPtWUph45fk5lHFSWogH3BDwLZHnNvk7zfeR4uFvnnolS9iXstMUcbsLd/oDeEyITi0VZ++erN7mprjfLE6JVqlK5FaG1jVVncyV8rEIujssA4OfddxaMQY4UqMatEFfC6cqDGhlfZHFzQhPxBxcX599Zg0ok3Ne69H1mB2aibZRiZQQWI/pcOSA5uJm8r2xiajsbBkAy4nyRH5TI67bAc11V3icUa+V8kGkQOh6VR84rPO2wNxdWdz/xbrygxx9o1S3d28Jcqvftuea+leqDvzZjmMk5HKsj+i8QqDT09hE9r7XKKAAsULKqrPC8=",
      prompt: "You are a helpful assistant.",
      typingTime: 1,
      reactionTime: 1,
      model: "gpt-4o",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Agent already exists" });

    await User.deleteMany({});
    await Agent.deleteMany({});
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Agent.deleteMany({});
  await mongoose.connection.close();
});
