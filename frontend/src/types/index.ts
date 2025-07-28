export interface AgentDTO {
  apiId: number;
  name: string;
  status: "active" | "frozen";
  planType: "month" | "year";
}

export interface AgentAdvancedDTO {
  name: string;
  status: "active" | "frozen";
  planType: "month" | "year";
  model: string;
  prompt: string;
  typingTime: number;
  reactionTime: number;
}
