-- One Auth account, ten independent save identities. Existing slot1 state/history/signatures stay byte-for-byte.
begin;
alter table public.game_saves add column if not exists owner_id uuid;
alter table public.game_saves add column if not exists save_slot integer not null default 1;
update public.game_saves set owner_id=account_id where owner_id is null;
alter table public.game_saves alter column owner_id set not null;
alter table public.game_saves drop constraint if exists game_saves_account_id_fkey;
do $block$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.game_saves'::regclass and conname='game_saves_owner_fkey') then
  alter table public.game_saves add constraint game_saves_owner_fkey foreign key(owner_id) references auth.users(id) on delete cascade;
  alter table public.game_saves add constraint game_saves_slot_range check(save_slot between 1 and 10);
  alter table public.game_saves add constraint game_saves_owner_slot_key unique(owner_id,save_slot);
 end if;
end $block$;

create or replace function public.game_save_slot_id(p_owner_id uuid,p_save_slot integer)
returns uuid language plpgsql immutable strict security invoker set search_path=''
as $function$
begin
 if p_save_slot not between 1 and 10 then raise exception 'INVALID_SAVE_SLOT'; end if;
 if p_save_slot=1 then return p_owner_id; end if;
 return pg_catalog.md5('ro-idle:save-slot:v1:'||p_owner_id::text||':'||p_save_slot::text)::uuid;
end;
$function$;
revoke all on function public.game_save_slot_id(uuid,integer) from public,anon,authenticated;
grant execute on function public.game_save_slot_id(uuid,integer) to service_role;

do $block$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.game_saves'::regclass and conname='game_saves_slot_identity') then
  alter table public.game_saves add constraint game_saves_slot_identity check(account_id=public.game_save_slot_id(owner_id,save_slot));
 end if;
end $block$;

-- Child records retain their original save-ID keys; ownership follows the parent save.
drop policy if exists own_save_read on public.game_saves;
create policy own_save_read on public.game_saves for select to authenticated using ((select auth.uid())=owner_id);
drop policy if exists own_receipt_read on public.game_command_receipts;
create policy own_receipt_read on public.game_command_receipts for select to authenticated using (exists(select 1 from public.game_saves s where s.account_id=game_command_receipts.account_id and s.owner_id=(select auth.uid())));
drop policy if exists own_battle_read on public.game_battle_checkpoints;
create policy own_battle_read on public.game_battle_checkpoints for select to authenticated using (exists(select 1 from public.game_saves s where s.account_id=game_battle_checkpoints.account_id and s.owner_id=(select auth.uid())));
drop policy if exists own_history_read on public.game_save_history;
create policy own_history_read on public.game_save_history for select to authenticated using (exists(select 1 from public.game_saves s where s.account_id=game_save_history.account_id and s.owner_id=(select auth.uid())));
drop policy if exists own_backup_read on public.game_save_backups;
create policy own_backup_read on public.game_save_backups for select to authenticated using (exists(select 1 from public.game_saves s where s.account_id=game_save_backups.account_id and s.owner_id=(select auth.uid())));
create or replace function public.game_read_own_save()
returns setof public.game_saves language sql stable security invoker set search_path=''
as $function$ select * from public.game_saves where owner_id=(select auth.uid()) order by save_slot; $function$;

-- The original 14 named parameters remain valid via defaults; older clients still create slot1.
drop function if exists public.game_create_account(uuid,uuid,text,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text);
create or replace function public.game_create_account(
  p_account_id uuid, p_request_id uuid, p_request_hash text,
  p_state jsonb, p_state_hash text, p_receipt jsonb,
  p_signature text, p_key_version integer,
  p_schema_version integer, p_content_version text, p_rules_version text,
  p_content_hash text, p_environment text, p_project_ref text,
  p_owner_id uuid default null, p_save_slot integer default 1
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare previous public.game_command_receipts%rowtype; owner uuid := coalesce(p_owner_id,p_account_id);
begin
  if p_account_id is distinct from public.game_save_slot_id(owner,p_save_slot) then raise exception 'SAVE_SLOT_ID_MISMATCH'; end if;
  perform public.game_assert_environment(p_environment, p_project_ref);
  -- The absent save row cannot be SELECT FOR UPDATE locked yet. All creations
  -- for the same verified owner use this transaction-scoped lock instead.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_account_id::text, 0));
  select * into previous from public.game_command_receipts
    where account_id=p_account_id and request_id=p_request_id;
  if found then
    if previous.request_hash <> p_request_hash then raise exception 'IDEMPOTENCY_KEY_REUSE'; end if;
    return previous.receipt;
  end if;
  if exists(select 1 from public.game_saves where account_id=p_account_id) then raise exception 'REVISION_CONFLICT'; end if;
  if p_receipt->>'request_id' is distinct from p_request_id::text
    or p_receipt->>'request_hash' is distinct from p_request_hash
    or p_receipt->>'command_type' is distinct from 'account.create'
    or p_receipt->>'outcome' is distinct from 'committed'
    or p_receipt->>'committed_revision' is distinct from '1' then
    raise exception 'INVALID_CREATION_RECEIPT';
  end if;
  insert into public.game_saves(account_id,revision,schema_version,content_version,rules_version,content_hash,state,state_hash,updated_at,owner_id,save_slot)
    values(p_account_id,1,p_schema_version,p_content_version,p_rules_version,p_content_hash,p_state,p_state_hash,(p_receipt->>'server_at')::timestamptz,owner,p_save_slot);
  insert into public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type)
    values(p_account_id,p_request_id,p_request_hash,p_receipt,'account.create');
  insert into public.game_save_history(account_id,revision,state,state_hash,signature,key_version)
    values(p_account_id,1,p_state,p_state_hash,p_signature,p_key_version);
  return p_receipt;
end;
$function$;
revoke all on function public.game_create_account(uuid,uuid,text,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text,uuid,integer) from public,anon,authenticated;
grant execute on function public.game_create_account(uuid,uuid,text,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text,uuid,integer) to service_role;

-- One small read when opening the chooser; no extra DB round-trip on gameplay commands.
create or replace function public.game_list_save_slots(p_owner_id uuid,p_environment text,p_project_ref text)
returns jsonb language plpgsql stable security invoker set search_path=''
as $function$
declare result jsonb;
begin
 perform public.game_assert_environment(p_environment,p_project_ref);
 select jsonb_agg(jsonb_build_object('slot',n,'save_id',public.game_save_slot_id(p_owner_id,n),
   'initialized',s.account_id is not null,'updated_at',s.updated_at,'revision',s.revision,
   'job_id',s.state->'roster'->0->>'job_id','level',s.state->'roster'->0->'level',
   'cleared_stages',case when jsonb_typeof(s.state->'story'->'cleared_stage_ids')='array' then jsonb_array_length(s.state->'story'->'cleared_stage_ids') else 0 end) order by n)
 into result from generate_series(1,10) n
 left join public.game_saves s on s.owner_id=p_owner_id and s.save_slot=n;
 return result;
end;
$function$;
revoke all on function public.game_list_save_slots(uuid,text,text) from public,anon,authenticated;
grant execute on function public.game_list_save_slots(uuid,text,text) to service_role;
notify pgrst,'reload schema';
commit;
