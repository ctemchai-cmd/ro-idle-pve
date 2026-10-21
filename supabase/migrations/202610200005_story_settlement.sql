-- Extend the existing transaction lease gate to terminal Story settlement.
-- One owner transaction: receipt replay, revision CAS, state/checkpoint/history.
-- All decisions/formulas are made by the authenticated server command reducer.
begin;
create or replace function public.game_commit_command(
 p_account_id uuid, p_request_id uuid, p_request_hash text,
 p_expected_revision bigint, p_state jsonb, p_state_hash text, p_receipt jsonb,
 p_signature text, p_key_version integer, p_schema_version integer,
 p_content_version text, p_rules_version text, p_content_hash text,
 p_battle_write jsonb, p_environment text, p_project_ref text
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare previous public.game_command_receipts%rowtype;
 current_save public.game_saves%rowtype; next_revision bigint;
 operation text := p_battle_write->>'kind';
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
 if current_save.content_hash <> p_content_hash or current_save.content_version <> p_content_version
   or current_save.rules_version <> p_rules_version or current_save.schema_version <> p_schema_version then raise exception 'CONTENT_VERSION_MISMATCH'; end if;
 if p_receipt->>'request_id' is distinct from p_request_id::text or p_receipt->>'request_hash' is distinct from p_request_hash
  or p_receipt->>'content_hash' is distinct from p_content_hash or p_receipt->>'outcome' is null or p_receipt->>'outcome' not in ('committed','rejected')
  or p_receipt->>'command_type' is null or operation is null or operation not in ('keep','delete','upsert') then raise exception 'INVALID_COMMAND_COMMIT'; end if;
 next_revision := current_save.revision + case when p_receipt->>'outcome'='committed' then 1 else 0 end;
 if p_receipt->>'committed_revision' is distinct from next_revision::text then raise exception 'INVALID_COMMAND_REVISION'; end if;
 if p_receipt->>'outcome'='rejected' then
  if p_state is distinct from current_save.state or p_state_hash is distinct from current_save.state_hash or operation <> 'keep' then raise exception 'REJECTED_COMMAND_MUTATION'; end if;
 else
  if operation='keep' and p_state->'active_battle' is distinct from current_save.state->'active_battle' then raise exception 'BATTLE_POINTER_MUTATION'; end if;
  -- Includes terminal delete/settlement, not just checkpoint upserts.
  if p_receipt->>'command_type'='battle.advance' and clock_timestamp() >= (current_save.state->'active_battle'->>'lease_expires_at')::timestamptz then raise exception 'BATTLE_LEASE_EXPIRED'; end if;
  if operation='delete' then
   if current_save.state->'active_battle'->>'battle_id' is distinct from p_battle_write->>'battle_id' then raise exception 'ACTIVE_BATTLE_MISMATCH'; end if;
   if p_state->'active_battle' is distinct from 'null'::jsonb then raise exception 'BATTLE_POINTER_MUTATION'; end if;
   delete from public.game_battle_checkpoints where account_id=p_account_id and battle_id::text=p_battle_write->>'battle_id';
  elsif operation='upsert' then
   if p_battle_write->'battle'->>'account_id' is distinct from p_account_id::text
    or p_state->'active_battle'->>'battle_id' is distinct from p_battle_write->'battle'->>'battle_id'
    or p_state->'active_battle'->>'last_ack_at' is distinct from p_battle_write->'battle'->>'last_ack_at'
    or p_state->'active_battle'->>'lease_expires_at' is distinct from p_battle_write->'battle'->>'lease_expires_at' then raise exception 'BATTLE_OWNER_MISMATCH'; end if;
   insert into public.game_battle_checkpoints(account_id,battle_id,payload,content_hash,last_ack_at,lease_expires_at)
   values(p_account_id,(p_battle_write->'battle'->>'battle_id')::uuid,p_battle_write->'battle'->'payload',p_content_hash,
    (p_battle_write->'battle'->>'last_ack_at')::timestamptz,(p_battle_write->'battle'->>'lease_expires_at')::timestamptz)
   on conflict(account_id,battle_id) do update set payload=excluded.payload,content_hash=excluded.content_hash,last_ack_at=excluded.last_ack_at,lease_expires_at=excluded.lease_expires_at;
  end if;
  update public.game_saves set revision=next_revision,state=p_state,state_hash=p_state_hash,updated_at=(p_receipt->>'server_at')::timestamptz where account_id=p_account_id;
  insert into public.game_save_history(account_id,revision,state,state_hash,signature,key_version)
    values(p_account_id,next_revision,p_state,p_state_hash,p_signature,p_key_version);
  delete from public.game_save_history h where h.account_id=p_account_id and h.revision < next_revision-19
   and h.revision not in (select distinct on ((created_at at time zone 'UTC')::date) revision from public.game_save_history
    where account_id=p_account_id and created_at >= clock_timestamp()-interval '7 days'
    order by (created_at at time zone 'UTC')::date,revision desc);
 end if;
 insert into public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type)
   values(p_account_id,p_request_id,p_request_hash,p_receipt,p_receipt->>'command_type');
 return p_receipt;
end;
$function$;
revoke all on function public.game_commit_command(uuid,uuid,text,bigint,jsonb,text,jsonb,text,integer,integer,text,text,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.game_commit_command(uuid,uuid,text,bigint,jsonb,text,jsonb,text,integer,integer,text,text,text,jsonb,text,text) to service_role;
commit;
