import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { BASE_URL };
