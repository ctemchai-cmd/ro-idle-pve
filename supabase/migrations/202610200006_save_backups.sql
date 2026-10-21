-- TASK-040: retained server backups and one atomic maintenance commit.
-- Migration, quarantine recovery, reset and undo-reset always copy the current row
-- (with its signed history entry when it matches) before writing the next revision.
-- The authenticated server decides the new state; this function only enforces
-- ownership, revision CAS, receipt replay and the backup-before-write order.
begin;
create table public.game_save_backups (
  account_id uuid not null references public.game_saves(account_id) on delete cascade,
  backup_id uuid not null,
  reason text not null check (reason in ('migration','reset','restore','quarantine')),
  revision bigint not null check (revision between 1 and 9007199254740991),
  schema_version integer not null check (schema_version >= 1),
  content_version text not null check (length(content_version) between 1 and 120),
  rules_version text not null check (length(rules_version) between 1 and 120),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  state_hash text not null check (state_hash ~ '^[a-f0-9]{64}$'),
  signature text check (signature is null or length(signature) between 1 and 500),
  key_version integer check (key_version is null or key_version >= 1),
  created_at timestamptz not null default clock_timestamp(),
  primary key (account_id, backup_id)
);
alter table public.game_save_backups enable row level security;
revoke all on public.game_save_backups from public, anon, authenticated, service_role;
grant select on public.game_save_backups to authenticated;
grant select, insert, delete on public.game_save_backups to service_role;
create policy own_backup_read on public.game_save_backups for select to authenticated using ((select auth.uid()) = account_id);

create function public.game_commit_maintenance(
 p_account_id uuid, p_request_id uuid, p_request_hash text, p_expected_revision bigint,
 p_reason text, p_backup_id uuid, p_state jsonb, p_state_hash text, p_receipt jsonb,
 p_signature text, p_key_version integer, p_schema_version integer,
 p_content_version text, p_rules_version text, p_content_hash text,
 p_environment text, p_project_ref text
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare previous public.game_command_receipts%rowtype;
 current_save public.game_saves%rowtype; tip public.game_save_history%rowtype; next_revision bigint;
begin
 perform public.game_assert_environment(p_environment,p_project_ref);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_account_id::text,0));
 select * into previous from public.game_command_receipts where account_id=p_account_id and request_id=p_request_id;
 if found then
  if previous.request_hash <> p_request_hash then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
  return previous.receipt;
 end if;
 select * into current_save from public.game_saves where account_id=p_account_id for update;
 if not found then raise exception 'ACCOUNT_NOT_INITIALIZED'; end if;
 if current_save.revision <> p_expected_revision then raise exception 'REVISION_CONFLICT'; end if;
 if p_reason is null or p_reason not in ('migration','reset','restore','quarantine') then raise exception 'INVALID_MAINTENANCE_REASON'; end if;
 next_revision := current_save.revision + 1;
 if p_receipt->>'request_id' is distinct from p_request_id::text or p_receipt->>'request_hash' is distinct from p_request_hash
  or p_receipt->>'content_hash' is distinct from p_content_hash or p_receipt->>'outcome' is distinct from 'committed'
  or p_receipt->>'command_type' is null or p_receipt->>'command_type' not in ('save.migrate','backup.restore_request','account.reset')
  or p_receipt->>'committed_revision' is distinct from next_revision::text then raise exception 'INVALID_MAINTENANCE_COMMIT'; end if;
 select * into tip from public.game_save_history where account_id=p_account_id and revision=current_save.revision;
 -- Backup first: the exact current row, signed only when its history tip really matches it.
 insert into public.game_save_backups(account_id,backup_id,reason,revision,schema_version,content_version,rules_version,content_hash,state,state_hash,signature,key_version)
  values(p_account_id,p_backup_id,p_reason,current_save.revision,current_save.schema_version,current_save.content_version,current_save.rules_version,
   current_save.content_hash,current_save.state,current_save.state_hash,
   case when tip.state_hash = current_save.state_hash and tip.state = current_save.state then tip.signature else null end,
   case when tip.state_hash = current_save.state_hash and tip.state = current_save.state then tip.key_version else null end);
 -- Battles never cross a maintenance write.
 delete from public.game_battle_checkpoints where account_id=p_account_id;
 update public.game_saves set revision=next_revision,schema_version=p_schema_version,content_version=p_content_version,rules_version=p_rules_version,
  content_hash=p_content_hash,state=p_state,state_hash=p_state_hash,updated_at=(p_receipt->>'server_at')::timestamptz where account_id=p_account_id;
 insert into public.game_save_history(account_id,revision,state,state_hash,signature,key_version)
  values(p_account_id,next_revision,p_state,p_state_hash,p_signature,p_key_version);
 delete from public.game_save_history h where h.account_id=p_account_id and h.revision < next_revision-19
  and h.revision not in (select distinct on ((created_at at time zone 'UTC')::date) revision from public.game_save_history
   where account_id=p_account_id and created_at >= clock_timestamp()-interval '7 days'
   order by (created_at at time zone 'UTC')::date,revision desc);
 -- Keep the ten newest backups per account.
 delete from public.game_save_backups b where b.account_id=p_account_id and b.backup_id not in
  (select backup_id from public.game_save_backups where account_id=p_account_id order by created_at desc, revision desc limit 10);
 insert into public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type)
  values(p_account_id,p_request_id,p_request_hash,p_receipt,p_receipt->>'command_type');
 return p_receipt;
end;
$function$;
revoke all on function public.game_commit_maintenance(uuid,uuid,text,bigint,text,uuid,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.game_commit_maintenance(uuid,uuid,text,bigint,text,uuid,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text) to service_role;
commit;
