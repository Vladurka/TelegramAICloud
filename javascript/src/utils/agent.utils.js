export function buildAgentPayloadForUpdate({
  userId,
  agentData,
  existingAgent,
}) {
  return {
    user_id: userId,
    api_id: agentData.apiId,
    api_hash: agentData.apiHash ?? existingAgent?.apiHash,
    session_string: agentData.sessionString ?? existingAgent?.sessionString,
    name: agentData.name?.trim() || existingAgent?.name,
    prompt: agentData.prompt?.trim() || existingAgent?.prompt,
    typing_time: agentData.typingTime ?? existingAgent?.typingTime ?? 0,
    reaction_time: agentData.reactionTime ?? existingAgent?.reactionTime ?? 0,
    model: agentData.model?.trim() || existingAgent?.model,
  };
}

export function buildAgentPayloadFromAgent(userId, agent) {
  return {
    user_id: userId,
    api_id: agent.apiId,
    name: agent.name,
    api_hash: agent.apiHash,
    session_string: agent.sessionString,
    prompt: agent.prompt,
    typing_time: agent.typingTime,
    reaction_time: agent.reactionTime,
    model: agent.model,
  };
}
