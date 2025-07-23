import { buildAgentPayload } from "../../../utils/agent.utils.js";

describe("buildAgentPayload", () => {
  it("should build payload with provided agentData", () => {
    const userId = "user123";
    const agentData = {
      apiId: "api123",
      apiHash: "hash123",
      sessionString: "session123",
      name: "John Doe",
      prompt: "Hello, how can I help you today?",
      typingTime: 5,
      reactionTime: 3,
      model: "gpt-4o",
    };
    const existingAgent = null;

    const payload = buildAgentPayload({ userId, agentData, existingAgent });

    expect(payload).toEqual({
      user_id: userId,
      api_id: agentData.apiId,
      api_hash: agentData.apiHash,
      session_string: agentData.sessionString,
      name: agentData.name,
      prompt: agentData.prompt,
      typing_time: agentData.typingTime,
      reaction_time: agentData.reactionTime,
      model: agentData.model,
    });
  });

  it("should use existingAgent data when agentData is incomplete", () => {
    const userId = "user123";
    const agentData = {
      apiId: "api123",
      apiHash: "hash123",
      sessionString: "session123",
    };
    const existingAgent = {
      name: "John Doe",
      prompt: "Hello, how can I help you today?",
      typingTime: 5,
      reactionTime: 3,
      model: "gpt-4o",
    };

    const payload = buildAgentPayload({ userId, agentData, existingAgent });

    expect(payload).toEqual({
      user_id: userId,
      api_id: agentData.apiId,
      api_hash: agentData.apiHash,
      session_string: agentData.sessionString,
      name: existingAgent.name,
      prompt: existingAgent.prompt,
      typing_time: existingAgent.typingTime,
      reaction_time: existingAgent.reactionTime,
      model: existingAgent.model,
    });
  });
});
