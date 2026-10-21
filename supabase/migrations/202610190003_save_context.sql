-- Server adapter reads one MVCC snapshot and the database clock. No player clock
-- or balancing calculation enters the database. Service-only and owner-scoped.
begin;
create function public.game_load_context(p_account_id uuid, p_environment text, p_project_ref text)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare result jsonb;
begin
  perform public.game_assert_environment(p_environment,p_project_ref);
  select jsonb_build_object(
    'server_at',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'save',to_jsonb(s), 'history',to_jsonb(h), 'battle',to_jsonb(b)
  ) into result
  from (select p_account_id as owner_id) owner
  left join public.game_saves s on s.account_id=owner.owner_id
  left join public.game_save_history h on h.account_id=s.account_id and h.revision=s.revision
  left join public.game_battle_checkpoints b on b.account_id=s.account_id
    and b.battle_id::text=s.state->'active_battle'->>'battle_id';
  return result;
end;
$function$;
revoke all on function public.game_load_context(uuid,text,text) from public,anon,authenticated;
grant execute on function public.game_load_context(uuid,text,text) to service_role;
commit;
