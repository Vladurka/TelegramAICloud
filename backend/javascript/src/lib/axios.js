import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.PROD_SERVER_URL
      : process.env.DEV_SERVER_URL,
});
