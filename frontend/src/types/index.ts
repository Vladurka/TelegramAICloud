export interface AgentDTO {
  apiId: number;
  name: string;
  status: "active" | "frozen";
  planType: "month" | "year" | null;
}

export interface AgentAdvancedDTO {
  name: string;
  status: "active" | "frozen";
  planType: "month" | "year" | null;
  model: string;
  prompt: string;
  typingTime: number;
  reactionTime: number;
}
