-- Canonical save/checkpoint/receipt ownership from plan/data/save-contracts.json.
-- No pricing, damage, reward or refund calculations belong in this migration.
begin;

create table public.game_saves (
  account_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null check (revision between 1 and 9007199254740991),
  schema_version integer not null check (schema_version >= 1),
  content_version text not null check (length(content_version) between 1 and 120),
  rules_version text not null check (length(rules_version) between 1 and 120),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  state_hash text not null check (state_hash ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.game_command_receipts (
  account_id uuid not null references public.game_saves(account_id) on delete cascade,
  request_id uuid not null,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  receipt jsonb not null check (jsonb_typeof(receipt) = 'object'),
  command_type text not null check (length(command_type) between 1 and 120),
  created_at timestamptz not null default clock_timestamp(),
  primary key (account_id, request_id),
  constraint receipt_request_identity check (receipt ->> 'request_id' is not null and receipt ->> 'request_id' = request_id::text)
);

create table public.game_battle_checkpoints (
  account_id uuid not null references public.game_saves(account_id) on delete cascade,
  battle_id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  last_ack_at timestamptz not null,
  lease_expires_at timestamptz not null check (lease_expires_at > last_ack_at),
  primary key (account_id, battle_id)
);

create table public.game_save_history (
  account_id uuid not null references public.game_saves(account_id) on delete cascade,
  revision bigint not null check (revision between 1 and 9007199254740991),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  state_hash text not null check (state_hash ~ '^[a-f0-9]{64}$'),
  signature text not null check (length(signature) between 1 and 500),
  key_version integer not null check (key_version >= 1),
  created_at timestamptz not null default clock_timestamp(),
  primary key (account_id, revision)
);

-- Operational identity, separate from player progression. An operator configures
-- this once per isolated project; migrations never silently relabel a database.
create table public.game_deployment (
  singleton boolean primary key default true check (singleton),
  environment text not null check (environment in ('local', 'test', 'preview', 'production')),
  project_ref text not null check (length(project_ref) between 1 and 200)
);

alter table public.game_saves enable row level security;
alter table public.game_command_receipts enable row level security;
alter table public.game_battle_checkpoints enable row level security;
alter table public.game_save_history enable row level security;
alter table public.game_deployment enable row level security;

-- Supabase installations can have broad default grants. Revoke explicitly.
revoke all on public.game_saves, public.game_command_receipts,
  public.game_battle_checkpoints, public.game_save_history, public.game_deployment
  from public, anon, authenticated;
grant select on public.game_saves, public.game_command_receipts,
  public.game_battle_checkpoints, public.game_save_history to authenticated;
revoke all on public.game_saves, public.game_command_receipts,
  public.game_battle_checkpoints, public.game_save_history, public.game_deployment from service_role;
grant select, insert, update, delete on public.game_saves,
  public.game_battle_checkpoints, public.game_save_history to service_role;
grant select, insert on public.game_command_receipts to service_role;
grant select on public.game_deployment to service_role;

create policy own_save_read on public.game_saves for select to authenticated using ((select auth.uid()) = account_id);
create policy own_receipt_read on public.game_command_receipts for select to authenticated using ((select auth.uid()) = account_id);
create policy own_battle_read on public.game_battle_checkpoints for select to authenticated using ((select auth.uid()) = account_id);
create policy own_history_read on public.game_save_history for select to authenticated using ((select auth.uid()) = account_id);

-- No authenticated/anonymous INSERT, UPDATE or DELETE policies are created.
-- Writes will use the authenticated-UID-bound API + atomic RPC in TASK-022.
create function public.game_read_own_save()
returns setof public.game_saves language sql stable security invoker
set search_path = ''
as $function$ select * from public.game_saves where account_id = (select auth.uid()); $function$;
revoke all on function public.game_read_own_save() from public, anon, authenticated;
grant execute on function public.game_read_own_save() to authenticated;

create function public.game_assert_environment(expected_environment text, expected_project_ref text)
returns boolean language plpgsql stable security invoker
set search_path = ''
as $function$
begin
  if not exists (select 1 from public.game_deployment where singleton
    and environment = expected_environment and project_ref = expected_project_ref) then
    raise exception 'ENVIRONMENT_MISMATCH' using errcode = 'P0001';
  end if;
  return true;
end;
$function$;
revoke all on function public.game_assert_environment(text, text) from public, anon, authenticated;
grant execute on function public.game_assert_environment(text, text) to service_role;

commit;
