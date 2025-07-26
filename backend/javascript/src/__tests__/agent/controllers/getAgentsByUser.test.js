import request from "supertest";
import app from "../../../../index.js";
import { connectDB } from "../../../lib/db.js";
import mongoose from "mongoose";
import { User } from "../../../models/user.model.js";
import { Agent } from "../../../models/agent.model.js";

beforeAll(async () => {
  await connectDB();
});

describe("GET /api/agent/getByUser", () => {
  it("should return agents for existing user", async () => {
    const user = await User.create({
      clerkId: "12345678",
      fullName: "VladVez",
    });

    const testAgent = await Agent.create({
      user: user._id,
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

    const res = await request(app).get("/api/agent/getByUser/" + user.clerkId);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        apiId: testAgent.apiId,
        name: testAgent.name,
        prompt: testAgent.prompt,
        typingTime: testAgent.typingTime,
        reactionTime: testAgent.reactionTime,
        model: testAgent.model,
      },
    ]);
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Agent.deleteMany({});
  await mongoose.connection.close();
});
