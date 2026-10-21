-- Initial authenticated write foundation. No balance logic or raw client state.
begin;
create function public.game_create_account(
  p_account_id uuid, p_request_id uuid, p_request_hash text,
  p_state jsonb, p_state_hash text, p_receipt jsonb,
  p_signature text, p_key_version integer,
  p_schema_version integer, p_content_version text, p_rules_version text,
  p_content_hash text, p_environment text, p_project_ref text
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare previous public.game_command_receipts%rowtype;
begin
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
  insert into public.game_saves(account_id,revision,schema_version,content_version,rules_version,content_hash,state,state_hash,updated_at)
    values(p_account_id,1,p_schema_version,p_content_version,p_rules_version,p_content_hash,p_state,p_state_hash,(p_receipt->>'server_at')::timestamptz);
  insert into public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type)
    values(p_account_id,p_request_id,p_request_hash,p_receipt,'account.create');
  insert into public.game_save_history(account_id,revision,state,state_hash,signature,key_version)
    values(p_account_id,1,p_state,p_state_hash,p_signature,p_key_version);
  return p_receipt;
end;
$function$;
revoke all on function public.game_create_account(uuid,uuid,text,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.game_create_account(uuid,uuid,text,jsonb,text,jsonb,text,integer,integer,text,text,text,text,text) to service_role;
commit;
