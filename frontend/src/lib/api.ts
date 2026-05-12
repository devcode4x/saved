import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL });

const SID_KEY = "tsv_session_id";

export function getSessionId(): string | null {
  return localStorage.getItem(SID_KEY);
}
export function setSessionId(id: string | null) {
  if (id) localStorage.setItem(SID_KEY, id);
  else localStorage.removeItem(SID_KEY);
}

api.interceptors.request.use((cfg) => {
  const sid = getSessionId();
  if (sid) cfg.headers["X-Session-Id"] = sid;
  return cfg;
});

export interface Message {
  id: number;
  text: string;
  date: string;
  tags: string[];
}
export interface Stats {
  total_messages: number;
  with_tags: number;
  unique_tags: number;
  last_message_date: string | null;
}
