import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import type { AgentDTO } from "../types";

export interface AgentStore {
  getAgents: (clerkId: string) => Promise<void>;
  agentDTOs: AgentDTO[];

  isLoading: boolean;
  error: string | null;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agentDTOs: [],

  isLoading: false,
  error: null,
  getAgents: async (clerkId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await axiosInstance.get("/agent/getByUser/" + clerkId);
      set({ agentDTOs: data.agents });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
