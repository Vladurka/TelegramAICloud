import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import type { AgentDTO } from "../types";
import type { CreateAgentInput } from "../pages/CreateAgent";
import type { AgentAdvancedDTO } from "../types";

export interface AgentStore {
  createAgent: (data: CreateAgentInput) => Promise<string>;

  unfreezeAgent: (apiId: number, clerkId: string) => Promise<string>;

  getAgents: (clerkId: string) => Promise<void>;
  agentDTOs: AgentDTO[];

  getAgentById: (apiId: number, clerkId: string) => Promise<void>;
  agent: AgentAdvancedDTO | null;

  deleteAgent: (apiId: number, clerkId: string) => Promise<void>;

  isLoading: boolean;
  error: string | null;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agentDTOs: [],

  agent: null,

  isLoading: false,
  error: null,

  createAgent: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/agent", data);
      return res.data.url;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  unfreezeAgent: async (apiId, clerkId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/agent/unfreeze", {
        apiId: apiId,
        clerkId: clerkId,
        planType: "year",
      });

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

  getAgentById: async (apiId, clerkId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await axiosInstance.get(
        "/agent/" + apiId + "/" + clerkId
      );
      set({ agent: data.agent });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAgent: async (apiId, clerkId) => {
    try {
      set({ isLoading: true, error: null });
      await axiosInstance.delete("/agent", {
        data: {
          apiId: apiId,
          clerkId: clerkId,
        },
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
