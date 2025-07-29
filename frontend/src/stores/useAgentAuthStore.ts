import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import type { TelegramFormInput } from "../pages/GetTelegramCode";
import type { ConfirmCodeInput } from "../pages/ConfirmTelegramCode";

export interface AgentAuthStore {
  sessionString: string | null;
  phoneHash: string | null;

  isLoading: boolean;
  error: string | null;

  getTelegramCode: (data: TelegramFormInput) => Promise<void>;
  confirmTelegramCode: (data: ConfirmCodeInput) => Promise<boolean>;
}

export const useAgentAuthStore = create<AgentAuthStore>((set) => ({
  sessionString: null,
  phoneHash: null,

  isLoading: false,
  error: null,

  getTelegramCode: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/auth-agent/sendCode", data);
      console.log(res.data);
      set({
        sessionString: res.data.session,
        phoneHash: res.data.phoneCodeHash,
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  confirmTelegramCode: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/auth-agent/confirmCode", data);

      if (res.status === 200) {
        return true;
      }

      set({ error: "Unexpected response from server" });
      return false;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
