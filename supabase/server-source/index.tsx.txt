import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use("*", logger(console.log));
app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], exposeHeaders: ["Content-Length"], maxAge: 600 }));

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(URL_, SERVICE);
const P = "/make-server-5628dc9d";
const BUCKET = "make-5628dc9d-avatars";
const JOB_BUCKET = "make-5628dc9d-job-photos";
const EXPERT_CATS = ["it", "hw", "mk", "ac", "bf", "el", "ds", "ed", "au"];

async function ensureBucket(name = BUCKET) {
  const { data } = await sb.storage.listBuckets();
  if (!data?.some(b => b.name === name)) await sb.storage.createBucket(name, { public: false });
}
ensureBucket().catch(e => console.log("bucket init failed", e));
ensureBucket(JOB_BUCKET).catch(e => console.log("job bucket init failed", e));

// Create the dedicated chat tables automatically using the project's database connection.
const MIGRATION = `
create table if not exists public.atha_chats (
  id text primary key, members uuid[] not null, job_id text not null, job_title text not null default '',
  last text not null default '', last_at timestamptz not null default now(), last_from uuid, created_at timestamptz not null default now());
create index if not exists atha_chats_members_idx on public.atha_chats using gin (members);
create table if not exists public.atha_messages (
  id uuid primary key default gen_random_uuid(), chat_id text not null references public.atha_chats(id) on delete cascade,
  sender uuid not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz);
create index if not exists atha_messages_chat_idx on public.atha_messages (chat_id, created_at);
alter table public.atha_chats enable row level security;
alter table public.atha_messages enable row level security;
do $$ begin alter publication supabase_realtime add table public.atha_messages; exception when others then null; end $$;
notify pgrst, 'reload schema';`;
let tablesReady: Promise<void> | null = null;
const ensureTables = () => tablesReady ??= (async () => {
  const url = Deno.env.get("SUPABASE_DB_URL");
  if (!url) throw new Error("SUPABASE_DB_URL not available");
  const sql = postgres(url, { max: 1, prepare: false });
  try { await sql.unsafe(MIGRATION); } finally { await sql.end(); }
  await new Promise(r => setTimeout(r, 1500)); // let the REST API pick up the new tables
})().catch(e => { tablesReady = null; console.log("migration failed", e); throw e; });
ensureTables().catch(() => {});

const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

async function authUser(c: any) {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  return error || !data.user ? null : data.user;
}
const authed = async (c: any) => (await authUser(c))?.id ?? null;

// Find a profile, recovering ones saved under older keys, or rebuild a basic one from the auth account.
async function loadProfile(user: any) {
  let p = await kv.get(`profile:${user.id}`);
  if (p) return p;
  for (const key of [`user:${user.id}`, `users:${user.id}`, `profiles:${user.id}`, `user_${user.id}`]) {
    const old = await kv.get(key);
    if (old?.name) { p = old; break; }
  }
  if (!p) {
    const all = await kv.getByPrefix("");
    p = all.find(v => v && typeof v === "object" && v.name && (v.id === user.id || v.userId === user.id || (v.email && v.email === user.email))) ?? null;
  }
  const meta = user.user_metadata ?? {};
  p = {
    role: "both", level: "casual", skills: [], years: 0, nic: "", bio: "", phone: "", address: "", avatarPath: "",
    ...(p ?? {}), id: user.id, email: user.email, name: p?.name ?? meta.name ?? user.email.split("@")[0], city: p?.city ?? meta.city ?? "Colombo", lastSeen: now(),
  };
  p.verified = p.level === "skilled" && !!p.nic && p.skills?.length > 0;
  await kv.set(`profile:${user.id}`, p);
  return p;
}

// Persist a notification and push it live to the user's channel.
async function notify(userId: string, n: Record<string, unknown>) {
  const at = now(), id = uid();
  const item = { id, read: false, at, ...n };
  await kv.set(`notif:${userId}:${at}_${id}`, item);
  await broadcast(`user:${userId}`, "notify", item);
}

const sign = async (bucket: string, path?: string) => {
  if (!path) return "";
  const { data } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? "";
};
const decodeImage = (data: unknown) => {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(String(data ?? ""));
  if (!m) return null;
  return { type: m[1], ext: m[1].split("/")[1].replace("jpeg", "jpg"), bytes: Uint8Array.from(atob(m[2]), ch => ch.charCodeAt(0)) };
};
// Who hears about a job: skill match for expert categories, same-city earners for odd jobs.
const matches = (p: any, job: any) => !!p && p.id !== job.ownerId && p.role !== "hire" &&
  (EXPERT_CATS.includes(job.cat) ? p.level === "skilled" && !!p.skills?.includes(job.cat) : p.city === job.city || job.remote);

// Attach a signed avatar URL.
async function withAvatar(p: any) {
  if (!p) return p;
  let avatar = "";
  if (p.avatarPath) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(p.avatarPath, 60 * 60 * 24);
    avatar = data?.signedUrl ?? "";
  }
  return { ...p, avatar };
}
const publicView = (p: any) => p && ({ id: p.id, name: p.name, city: p.city, avatar: p.avatar, verified: p.verified, years: p.years, lastSeen: p.lastSeen });
const profiles = async (ids: string[]) => {
  const list = await kv.mget(ids.map(i => `profile:${i}`));
  const map: Record<string, any> = {};
  for (const p of await Promise.all(list.filter(Boolean).map(withAvatar))) map[p.id] = publicView(p);
  return map;
};

// Server-side Realtime broadcast (notifications and live messages).
async function broadcast(topic: string, event: string, payload: unknown) {
  try {
    await fetch(`${URL_}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
      body: JSON.stringify({ messages: [{ topic, event, payload }] }),
    });
  } catch (e) { console.log("broadcast failed", topic, e); }
}

app.get(`${P}/health`, c => c.json({ status: "ok" }));

/* ---------- Auth & profile ---------- */
app.post(`${P}/signup`, async c => {
  const b = await c.req.json();
  if (!b.name || !b.email || !b.password || !b.city) return c.json({ error: "Name, email, password and city are required." }, 400);
  const { data, error } = await sb.auth.admin.createUser({ email: b.email, password: b.password, user_metadata: { name: b.name }, email_confirm: true });
  if (error) return c.json({ error: error.message }, 400);
  const id = data.user.id;
  const profile = {
    id, name: b.name, email: b.email, phone: b.phone ?? "", city: b.city, address: b.address ?? "", role: b.role ?? "both",
    level: b.level ?? "casual", skills: b.skills ?? [], years: Number(b.years) || 0, nic: b.nic ?? "", bio: b.bio ?? "",
    verified: b.level === "skilled" && !!b.nic && (b.skills ?? []).length > 0, avatarPath: "", lastSeen: now(),
  };
  await kv.set(`profile:${id}`, profile);
  return c.json({ profile });
});

app.get(`${P}/profile`, async c => {
  const user = await authUser(c); if (!user) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ profile: await withAvatar(await loadProfile(user)) });
});

/* ---------- Notifications ---------- */
app.get(`${P}/notifications`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const list = (await kv.getByPrefix(`notif:${id}:`)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  return c.json({ notifications: list });
});
app.put(`${P}/notifications/read`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const list = (await kv.getByPrefix(`notif:${id}:`)).filter(n => !n.read);
  if (list.length) await kv.mset(list.map(n => `notif:${id}:${n.at}_${n.id}`), list.map(n => ({ ...n, read: true })));
  return c.json({ ok: true });
});
// Tell an expert about already-open jobs that match their skills (once per job).
app.post(`${P}/jobs/matches`, async c => {
  const user = await authUser(c); if (!user) return c.json({ error: "Unauthorized" }, 401);
  const me = await loadProfile(user);
  const seen: string[] = (await kv.get(`matched:${me.id}`)) ?? [];
  const fresh = (await kv.getByPrefix("job:")).filter(j => j.status === "open" && matches(me, j) && !seen.includes(j.id));
  if (fresh.length) {
    await kv.set(`matched:${me.id}`, [...seen, ...fresh.map(j => j.id)].slice(-500));
    await notify(me.id, fresh.length === 1
      ? { kind: "job", jobId: fresh[0].id, title: "A job needs your expertise", body: fresh[0].title }
      : { kind: "job", title: `${fresh.length} open jobs need your expertise`, body: fresh.slice(0, 3).map(j => j.title).join(" · ") });
  }
  return c.json({ count: fresh.length });
});

app.put(`${P}/profile`, async c => {
  const user = await authUser(c); if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = user.id; const old = await loadProfile(user); const b = await c.req.json();
  const keep = ["name", "phone", "city", "address", "role", "level", "skills", "years", "nic", "bio"];
  const p = { ...old };
  for (const k of keep) if (b[k] !== undefined) p[k] = b[k];
  p.verified = p.level === "skilled" && !!p.nic && p.skills?.length > 0;
  await kv.set(`profile:${id}`, p);
  return c.json({ profile: await withAvatar(p) });
});

// Photo arrives as a base64 data URL in JSON (the gateway rejects multipart uploads).
app.post(`${P}/avatar`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const { data } = await c.req.json().catch(() => ({ data: "" }));
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(String(data ?? ""));
  if (!m) return c.json({ error: "Please choose an image file." }, 400);
  const bytes = Uint8Array.from(atob(m[2]), ch => ch.charCodeAt(0));
  if (bytes.length > 5 * 1024 * 1024) return c.json({ error: "Photo must be under 5 MB." }, 400);
  await ensureBucket();
  const path = `${id}/${Date.now()}.${m[1].split("/")[1].replace("jpeg", "jpg")}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: m[1], upsert: true });
  if (error) return c.json({ error: `Upload failed: ${error.message}` }, 500);
  const p = await kv.get(`profile:${id}`);
  if (!p) return c.json({ error: "Profile not found" }, 404);
  if (p.avatarPath) await sb.storage.from(BUCKET).remove([p.avatarPath]);
  p.avatarPath = path; await kv.set(`profile:${id}`, p);
  return c.json({ profile: await withAvatar(p) });
});

// Heartbeat for "last seen".
app.post(`${P}/ping`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const p = await kv.get(`profile:${id}`); if (p) { p.lastSeen = now(); await kv.set(`profile:${id}`, p); }
  return c.json({ ok: true });
});
app.get(`${P}/users/:id`, async c => {
  if (!(await authed(c))) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ user: (await profiles([c.req.param("id")]))[c.req.param("id")] ?? null });
});

/* ---------- Jobs & bids ---------- */
const bidCount = async (jobId: string) => (await kv.getByPrefix(`bid:${jobId}:`)).length;
const withCounts = async (jobs: any[]) => {
  const people = await profiles([...new Set(jobs.map(j => j.ownerId))]);
  return Promise.all(jobs.map(async j => ({ ...j, bids: await bidCount(j.id), photoUrls: await Promise.all((j.photoPaths ?? (j.photoPath ? [j.photoPath] : [])).map((x: string) => sign(JOB_BUCKET, x))), posterAvatar: people[j.ownerId]?.avatar ?? "" })));
};

app.get(`${P}/jobs`, async c => {
  if (!(await authed(c))) return c.json({ error: "Unauthorized" }, 401);
  const jobs = (await kv.getByPrefix("job:")).filter(j => j.status === "open");
  return c.json({ jobs: await withCounts(jobs) });
});
app.get(`${P}/jobs/mine`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const jobs = (await kv.getByPrefix("job:")).filter(j => j.ownerId === id).sort((a, b) => b.created.localeCompare(a.created));
  return c.json({ jobs: await withCounts(jobs) });
});
app.post(`${P}/jobs`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const me = await kv.get(`profile:${id}`);
  if (me.role === "earn") return c.json({ error: "Expert-only accounts can't post jobs." }, 403);
  const b = await c.req.json();
  const job: any = { id: uid(), ownerId: id, poster: me.name, cat: b.cat, title: b.title, desc: b.desc ?? "", city: b.city, place: b.place ?? "", price: Number(b.price), ll: b.ll, remote: !!b.remote, status: "open", created: now(),
    priority: ["urgent", "high", "medium", "low"].includes(b.priority) ? b.priority : "medium", photoPaths: [] as string[] };
  // Up to 3 snapshots, stored in the dedicated job-photos bucket (not the avatar bucket).
  const photos: unknown[] = (Array.isArray(b.photos) ? b.photos : b.photo ? [b.photo] : []).slice(0, 3);
  if (photos.length) await ensureBucket(JOB_BUCKET);
  for (const [i, raw] of photos.entries()) {
    const img = decodeImage(raw);
    if (!img) return c.json({ error: "Job photos must be images." }, 400);
    if (img.bytes.length > 5 * 1024 * 1024) return c.json({ error: "Each job photo must be under 5 MB." }, 400);
    const path = `${id}/${job.id}/${i + 1}.${img.ext}`;
    const { error } = await sb.storage.from(JOB_BUCKET).upload(path, img.bytes, { contentType: img.type, upsert: true });
    if (error) return c.json({ error: `Photo upload failed: ${error.message}` }, 500);
    job.photoPaths.push(path);
  }
  await kv.set(`job:${job.id}`, job);
  // Alert matching experts right away.
  const experts = (await kv.getByPrefix("profile:")).filter(p => matches(p, job));
  await Promise.all(experts.map(async p => {
    const seen: string[] = (await kv.get(`matched:${p.id}`)) ?? [];
    await kv.set(`matched:${p.id}`, [...seen, job.id].slice(-500));
    await notify(p.id, { kind: "job", jobId: job.id, title: `${job.priority === "urgent" ? "URGENT: " : ""}${EXPERT_CATS.includes(job.cat) ? "New job needs your expertise" : "New job near you"}`, body: `${job.title} · Rs ${job.price.toLocaleString()} · ${job.city}` });
  }));
  return c.json({ job: (await withCounts([job]))[0] });
});
app.put(`${P}/jobs/:id/status`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const job = await kv.get(`job:${c.req.param("id")}`);
  if (!job || job.ownerId !== id) return c.json({ error: "Not your job" }, 403);
  job.status = (await c.req.json()).status; await kv.set(`job:${job.id}`, job);
  return c.json({ job });
});
app.get(`${P}/jobs/:id/bids`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const job = await kv.get(`job:${c.req.param("id")}`);
  if (!job || job.ownerId !== id) return c.json({ error: "Not your job" }, 403);
  const bids = await kv.getByPrefix(`bid:${job.id}:`);
  const people = await profiles(bids.map(b => b.expertId));
  return c.json({ bids: bids.map(b => ({ ...b, avatar: people[b.expertId]?.avatar ?? "", name: people[b.expertId]?.name ?? b.name })) });
});
app.post(`${P}/jobs/:id/bids`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const job = await kv.get(`job:${c.req.param("id")}`);
  if (!job || job.status !== "open") return c.json({ error: "This job is no longer open." }, 400);
  if (job.ownerId === id) return c.json({ error: "You can't bid on your own job." }, 400);
  const me = await kv.get(`profile:${id}`);
  if (me.role === "hire") return c.json({ error: "Switch your role to Earn or Both to bid." }, 403);
  if (EXPERT_CATS.includes(job.cat) && !(me.level === "skilled" && me.skills?.includes(job.cat) && me.nic)) return c.json({ error: "This category needs a verified skilled profile." }, 403);
  const existing = (await kv.getByPrefix(`bid:${job.id}:`)).find(b => b.expertId === id);
  const b = await c.req.json();
  const bid = { id: existing?.id ?? uid(), jobId: job.id, expertId: id, name: me.name, city: me.city, years: me.years, verified: me.verified, labour: Number(b.labour) || 0, mat: Number(b.mat) || 0, note: b.note ?? "", status: "pending", created: now() };
  await kv.set(`bid:${job.id}:${bid.id}`, bid);
  await notify(job.ownerId, { kind: "bid", jobId: job.id, title: `New bid from ${me.name}`, body: `Rs ${(bid.labour + bid.mat).toLocaleString()} on "${job.title}"` });
  return c.json({ bid });
});
app.get(`${P}/bids/mine`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const bids = (await kv.getByPrefix("bid:")).filter(b => b.expertId === id);
  const jobs = await kv.mget(bids.map(b => `job:${b.jobId}`));
  const byId = Object.fromEntries((await withCounts(jobs.filter(Boolean))).map(j => [j.id, j]));
  return c.json({ bids: bids.map(b => ({ ...b, job: byId[b.jobId] })).sort((a, b) => b.created.localeCompare(a.created)) });
});
app.put(`${P}/bids/accept`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const { bidId } = await c.req.json();
  const bid = (await kv.getByPrefix("bid:")).find(b => b.id === bidId);
  const job = bid && await kv.get(`job:${bid.jobId}`);
  if (!job || job.ownerId !== id) return c.json({ error: "Not your job" }, 403);
  const all = await kv.getByPrefix(`bid:${job.id}:`);
  await kv.mset(all.map(b => `bid:${job.id}:${b.id}`), all.map(b => ({ ...b, status: b.id === bidId ? "accepted" : "declined" })));
  Object.assign(job, { status: "assigned", assignee: bid.name, assigneeId: bid.expertId, agreed: bid.labour + bid.mat });
  await kv.set(`job:${job.id}`, job);
  await notify(bid.expertId, { kind: "hired", jobId: job.id, title: "You've been hired!", body: job.title });
  return c.json({ job });
});

/* ---------- Chats (dedicated Postgres tables) ---------- */
const chatOut = (row: any, people: Record<string, any>, me: string, unread = 0) => {
  const otherId = row.members.find((m: string) => m !== me) ?? "";
  return { id: row.id, members: row.members, jobId: row.job_id, jobTitle: row.job_title, last: row.last, lastAt: row.last_at, lastFrom: row.last_from, other: people[otherId] ?? { id: otherId, name: "User" }, unread,
    // Kept for older published app builds that read chat.names.
    names: Object.fromEntries(row.members.map((m: string) => [m, people[m]?.name ?? "User"])) };
};
const tableErr = (e: any) => ({ error: `Chat storage isn't ready yet — please try again in a moment. (${e.message})` });
app.use(`${P}/chats`, async (_c, next) => { await ensureTables().catch(() => {}); await next(); });
app.use(`${P}/chats/*`, async (_c, next) => { await ensureTables().catch(() => {}); await next(); });

app.post(`${P}/chats`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const { otherId, jobId } = await c.req.json();
  if (!otherId || otherId === id) return c.json({ error: "Invalid chat partner" }, 400);
  const job = await kv.get(`job:${jobId}`);
  const chatId = `${jobId}_${[id, otherId].sort().join("_")}`;
  const { data: found, error: e1 } = await sb.from("atha_chats").select("*").eq("id", chatId).maybeSingle();
  if (e1) return c.json(tableErr(e1), 500);
  let row = found;
  if (!row) {
    const { data, error } = await sb.from("atha_chats").insert({ id: chatId, members: [id, otherId], job_id: jobId, job_title: job?.title ?? "" }).select().single();
    if (error) return c.json(tableErr(error), 500);
    row = data;
  }
  return c.json({ chat: chatOut(row, await profiles(row.members), id) });
});

app.get(`${P}/chats`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await sb.from("atha_chats").select("*").contains("members", [id]).order("last_at", { ascending: false });
  if (error) return c.json(tableErr(error), 500);
  const people = await profiles([...new Set(data.flatMap(r => r.members))]);
  const { data: unread } = await sb.from("atha_messages").select("chat_id").in("chat_id", data.map(r => r.id)).neq("sender", id).is("read_at", null);
  const counts: Record<string, number> = {};
  for (const u of unread ?? []) counts[u.chat_id] = (counts[u.chat_id] ?? 0) + 1;
  return c.json({ chats: data.map(r => chatOut(r, people, id, counts[r.id] ?? 0)) });
});

const memberChat = async (chatId: string, id: string) => {
  const { data } = await sb.from("atha_chats").select("*").eq("id", chatId).maybeSingle();
  return data && data.members.includes(id) ? data : null;
};
const msgOut = (m: any) => ({ id: m.id, from: m.sender, text: m.body, at: m.created_at, readAt: m.read_at });

app.get(`${P}/chats/:id/messages`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const row = await memberChat(c.req.param("id"), id); if (!row) return c.json({ error: "Chat not found" }, 404);
  const { data, error } = await sb.from("atha_messages").select("*").eq("chat_id", row.id).order("created_at").limit(500);
  if (error) return c.json(tableErr(error), 500);
  return c.json({ chat: chatOut(row, await profiles(row.members), id), messages: data.map(msgOut) });
});

app.post(`${P}/chats/:id/messages`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const row = await memberChat(c.req.param("id"), id); if (!row) return c.json({ error: "Chat not found" }, 404);
  const text = String((await c.req.json()).text ?? "").trim().slice(0, 2000);
  if (!text) return c.json({ error: "Empty message" }, 400);
  const { data, error } = await sb.from("atha_messages").insert({ chat_id: row.id, sender: id, body: text }).select().single();
  if (error) return c.json(tableErr(error), 500);
  await sb.from("atha_chats").update({ last: text, last_at: data.created_at, last_from: id }).eq("id", row.id);
  const msg = msgOut(data); const me = await kv.get(`profile:${id}`);
  const other = row.members.find((m: string) => m !== id);
  await Promise.all([
    broadcast(`chat:${row.id}`, "msg", msg),
    notify(other, { kind: "msg", chatId: row.id, title: me?.name ?? "New message", body: text }),
  ]);
  return c.json({ message: msg });
});

app.put(`${P}/chats/:id/read`, async c => {
  const id = await authed(c); if (!id) return c.json({ error: "Unauthorized" }, 401);
  const row = await memberChat(c.req.param("id"), id); if (!row) return c.json({ error: "Chat not found" }, 404);
  const at = now();
  const { data } = await sb.from("atha_messages").update({ read_at: at }).eq("chat_id", row.id).neq("sender", id).is("read_at", null).select("id");
  if (data?.length) await broadcast(`chat:${row.id}`, "read", { by: id, at });
  return c.json({ ok: true });
});

Deno.serve(app.fetch);
