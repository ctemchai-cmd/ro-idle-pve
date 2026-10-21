-- Optional latency optimization. Existing atomic commit and environment/owner guards remain authoritative.
-- Safe to re-run: only defines service-role RPCs; does not change existing saves or table grants.
begin;
create or replace function public.game_load_command_context(
 p_account_id uuid, p_request_id uuid, p_environment text, p_project_ref text
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare context jsonb; previous jsonb;
begin
 perform public.game_assert_environment(p_environment,p_project_ref);
 -- Keep receipt and save tip consistent while reading, then release before Node calculates the proposal.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_account_id::text,0));
 context := public.game_load_context(p_account_id,p_environment,p_project_ref);
 select jsonb_build_object('request_hash',r.request_hash,'receipt',r.receipt) into previous
 from public.game_command_receipts r where r.account_id=p_account_id and r.request_id=p_request_id;
 return jsonb_build_object('context',context,'previous',previous);
end;
$function$;
revoke all on function public.game_load_command_context(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.game_load_command_context(uuid,uuid,text,text) to service_role;

create or replace function public.game_commit_command_context(
 p_account_id uuid, p_request_id uuid, p_request_hash text,
 p_expected_revision bigint, p_state jsonb, p_state_hash text, p_receipt jsonb,
 p_signature text, p_key_version integer, p_schema_version integer,
 p_content_version text, p_rules_version text, p_content_hash text,
 p_battle_write jsonb, p_environment text, p_project_ref text
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare receipt jsonb;
begin
 receipt := public.game_commit_command(p_account_id,p_request_id,p_request_hash,
   p_expected_revision,p_state,p_state_hash,p_receipt,p_signature,p_key_version,p_schema_version,
   p_content_version,p_rules_version,p_content_hash,p_battle_write,p_environment,p_project_ref);
 -- The old commit retains its owner advisory lock until this transaction returns its actual DB checkpoint.
 return jsonb_build_object('receipt',receipt,'context',public.game_load_context(p_account_id,p_environment,p_project_ref));
end;
$function$;
revoke all on function public.game_commit_command_context(uuid,uuid,text,bigint,jsonb,text,jsonb,text,integer,integer,text,text,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.game_commit_command_context(uuid,uuid,text,bigint,jsonb,text,jsonb,text,integer,integer,text,text,text,jsonb,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
