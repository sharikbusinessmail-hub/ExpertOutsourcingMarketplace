import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../utils/supabase/info";

// Reuse one client across hot reloads so only one GoTrueClient exists per page.
const g = globalThis as unknown as { __athaSupabase?: ReturnType<typeof createClient> };
export const supabase = (g.__athaSupabase ??= createClient(`https://${projectId}.supabase.co`, publicAnonKey));
const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-5628dc9d`;

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? publicAnonKey;
  const res = await fetch(BASE + path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const raw = await res.text();
  let json: any = {};
  try { json = JSON.parse(raw); } catch { json = { error: raw.slice(0, 200) || undefined }; }
  if (!res.ok) {
    console.log(`API ${path} failed`, json);
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }
  return json;
}

export type Profile = {
  id: string; name: string; email: string; phone: string; city: string; address: string;
  role: "hire" | "earn" | "both"; level: "casual" | "skilled"; skills: string[]; years: number; nic: string; bio: string; verified: boolean; avatar?: string; lastSeen?: string;
};
export type Person = { id: string; name: string; city?: string; avatar?: string; verified?: boolean; lastSeen?: string };
export type Job = {
  id: string; ownerId: string; poster: string; cat: string; title: string; desc: string; city: string; place: string;
  price: number; ll?: [number, number]; remote: boolean; status: "open" | "assigned" | "done" | "closed"; bids: number; created: string;
  assignee?: string; assigneeId?: string; agreed?: number; photoUrls?: string[]; posterAvatar?: string; priority?: "urgent" | "high" | "medium" | "low";
};
export type Bid = { id: string; jobId: string; expertId: string; name: string; city: string; years: number; verified: boolean; avatar?: string; labour: number; mat: number; note: string; status: string; created: string; job?: Job };
export type Chat = { id: string; members: string[]; other: Person; jobId: string; jobTitle: string; last: string; lastAt: string; lastFrom?: string; unread: number };
export type Msg = { id: string; from: string; text: string; at: string; readAt?: string | null };
export type Notice = { id?: string; read?: boolean; kind: "bid" | "msg" | "hired" | "job"; title: string; body: string; at: string; chatId?: string; jobId?: string };

// Sent as base64 JSON: the function gateway rejects multipart/form-data uploads.
export async function uploadAvatar(file: Blob) {
  const data = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = bad; r.readAsDataURL(file); });
  return (await api<{ profile: Profile }>("/avatar", { body: { data } })).profile;
}
