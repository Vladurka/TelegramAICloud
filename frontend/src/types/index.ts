export interface AgentDTO {
  apiId: number;
  name: string;
  status: "active" | "frozen";
  planType: "month" | "year";
}
