import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import type { AgentDTO } from "../types";
import type { CreateAgentInput } from "../pages/CreateAgent";

export interface AgentStore {
  createAgent: (data: CreateAgentInput) => Promise<string>;
  getAgents: (clerkId: string) => Promise<void>;
  agentDTOs: AgentDTO[];

  isLoading: boolean;
  error: string | null;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agentDTOs: [],

  isLoading: false,
  error: null,

  createAgent: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/agent/create", data);
      return res.data.url;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
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
