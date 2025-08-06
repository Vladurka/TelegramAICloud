import { axiosInstance } from "../lib/axios";
import { create } from "zustand";
import type { TelegramFormInput } from "../pages/GetTelegramCode";
import type { ConfirmCodeInput } from "../pages/ConfirmTelegramCode";

export interface AgentAuthStore {
  apiId: number | null;
  apiHash: string | null;
  phone: string | null;
  phoneHash: string | null;
  sessionString: string | null;

  isLoading: boolean;
  error: string | null;

  getTelegramCode: (data: TelegramFormInput) => Promise<void>;
  confirmTelegramCode: (data: ConfirmCodeInput) => Promise<boolean>;
  getTempData: (clerkId: string) => Promise<void>;
}

export const useAgentAuthStore = create<AgentAuthStore>((set) => ({
  apiId: null,
  apiHash: null,
  phone: null,
  sessionString: null,
  phoneHash: null,

  isLoading: false,
  error: null,

  getTelegramCode: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axiosInstance.post("/auth-agent/sendCode", data);

      set({
        sessionString: res.data.session,
        phoneHash: res.data.phoneCodeHash,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Unknown error occurred";

      set({ error: errorMsg });
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
      const errorMsg = error.response?.data?.error || "Unknown error occurred";

      set({ error: errorMsg });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  getTempData: async (clerkId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await axiosInstance.get("/auth-agent/" + clerkId);
      set({
        apiId: data.apiId,
        apiHash: data.apiHash,
        phone: data.phone,
        phoneHash: data.phoneHash,
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
