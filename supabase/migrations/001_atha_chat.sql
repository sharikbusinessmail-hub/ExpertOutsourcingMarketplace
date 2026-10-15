-- atha: dedicated chat tables (run once in Supabase Dashboard > SQL Editor)
create table if not exists public.atha_chats (
  id text primary key,
  members uuid[] not null,
  job_id text not null,
  job_title text not null default '',
  last text not null default '',
  last_at timestamptz not null default now(),
  last_from uuid,
  created_at timestamptz not null default now()
);
create index if not exists atha_chats_members_idx on public.atha_chats using gin (members);

create table if not exists public.atha_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id text not null references public.atha_chats(id) on delete cascade,
  sender uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists atha_messages_chat_idx on public.atha_messages (chat_id, created_at);

-- The edge function uses the service role; block direct client access.
alter table public.atha_chats enable row level security;
alter table public.atha_messages enable row level security;

-- Enable Supabase Realtime on messages.
do $$ begin
  alter publication supabase_realtime add table public.atha_messages;
exception when duplicate_object then null; end $$;
