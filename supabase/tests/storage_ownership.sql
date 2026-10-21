\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
insert into public.game_saves(account_id, revision, schema_version, content_version, rules_version, content_hash, state, state_hash)
select id, 1, 1, 'test-content', 'test-rules', repeat('a',64), '{"fixture":"SQL storage permissions only"}', repeat('b',64) from auth.users;
insert into public.game_save_history(account_id,revision,state,state_hash,signature,key_version) select account_id,revision,state,state_hash,'test-signature',1 from public.game_saves;
insert into public.game_command_receipts(account_id,request_id,request_hash,receipt,command_type)
select account_id,'33333333-3333-4333-8333-333333333333',repeat('a',64),'{"request_id":"33333333-3333-4333-8333-333333333333"}','fixture' from public.game_saves;
insert into public.game_battle_checkpoints(account_id,battle_id,payload,content_hash,last_ack_at,lease_expires_at)
select account_id,'44444444-4444-4444-8444-444444444444','{}',repeat('a',64),now(),now()+interval '15 seconds' from public.game_saves;
insert into public.game_deployment values (true,'test','local-isolated-fixture');
insert into public.game_save_backups(account_id,backup_id,reason,revision,schema_version,content_version,rules_version,content_hash,state,state_hash)
select account_id,'77777777-7777-4777-8777-777777777777','reset',1,1,'test-content','test-rules',repeat('a',64),state,state_hash from public.game_saves;

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $$
declare n integer; table_name text;
begin
  foreach table_name in array array['game_saves','game_command_receipts','game_battle_checkpoints','game_save_history','game_save_backups'] loop
    execute format('select count(*) from public.%I',table_name) into n;
    if n <> 1 then raise exception 'Owner read failed for %: %',table_name,n; end if;
    execute format('select count(*) from public.%I where account_id=%L',table_name,'22222222-2222-4222-8222-222222222222') into n;
    if n <> 0 then raise exception 'Other owner visible: %',table_name; end if;
  end loop;
  select count(*) from public.game_read_own_save() into n;
  if n <> 1 then raise exception 'RPC ownership failed'; end if;
  begin
    update public.game_saves set revision=999 where account_id=auth.uid();
    raise exception 'Direct owner write unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.game_saves where account_id=auth.uid();
    raise exception 'Direct owner delete unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.game_deployment values (true,'production','forged');
    raise exception 'Authenticated environment relabel unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.game_saves(account_id,revision,schema_version,content_version,rules_version,content_hash,state,state_hash)
    values (auth.uid(),1,1,'forged','forged',repeat('a',64),jsonb_build_object('account_id',auth.uid()::text),repeat('a',64));
    raise exception 'Direct owner insert unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.game_assert_environment('test','local-isolated-fixture');
    raise exception 'Privileged RPC unexpectedly accessible';
  exception when insufficient_privilege then null; end;
  -- TASK-040: backups are owner-readable only; no owner writes, no maintenance RPC.
  begin
    insert into public.game_save_backups(account_id,backup_id,reason,revision,schema_version,content_version,rules_version,content_hash,state,state_hash)
    values (auth.uid(),'88888888-8888-4888-8888-888888888888','reset',1,1,'f','f',repeat('a',64),'{}',repeat('a',64));
    raise exception 'Owner backup insert unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.game_save_backups where account_id=auth.uid();
    raise exception 'Owner backup delete unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.game_commit_maintenance(auth.uid(),'55555555-5555-4555-8555-555555555555',repeat('c',64),1,'reset','66666666-6666-4666-8666-666666666666','{}'::jsonb,repeat('d',64),'{}'::jsonb,'s',1,1,'f','f',repeat('a',64),'test','local-isolated-fixture');
    raise exception 'Owner maintenance RPC unexpectedly accessible';
  exception when insufficient_privilege then null; end;
end $$;

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $$ begin
  if (select account_id from public.game_read_own_save()) <> auth.uid() then raise exception 'Second identity RPC owner mismatch'; end if;
end $$;

set local role anon;
set local request.jwt.claim.sub = '';
do $$
declare table_name text;
begin
  foreach table_name in array array['game_saves','game_command_receipts','game_battle_checkpoints','game_save_history','game_deployment','game_save_backups'] loop
    begin
      execute format('select * from public.%I',table_name);
      raise exception 'Anonymous table read unexpectedly accepted: %',table_name;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    perform public.game_read_own_save();
    raise exception 'Anonymous RPC unexpectedly accepted';
  exception when insufficient_privilege then null; end;
end $$;

set local role service_role;
do $$ begin
  perform public.game_assert_environment('test','local-isolated-fixture');
  begin
    perform public.game_assert_environment('production','local-isolated-fixture');
    raise exception 'Wrong environment unexpectedly accepted';
  exception when raise_exception then if sqlerrm <> 'ENVIRONMENT_MISMATCH' then raise; end if; end;
  if (select count(*) from public.game_saves) <> 2 then raise exception 'Service role read failed'; end if;
  update public.game_saves set revision=2 where account_id='11111111-1111-4111-8111-111111111111';
  if (select revision from public.game_saves where account_id='11111111-1111-4111-8111-111111111111') <> 2 then raise exception 'Server storage update failed'; end if;
  begin
    update public.game_command_receipts set command_type='forged';
    raise exception 'Receipt update unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.game_command_receipts;
    raise exception 'Receipt deletion unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    truncate public.game_command_receipts;
    raise exception 'Receipt truncate unexpectedly accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.game_deployment set environment='production';
    raise exception 'Service API relabel unexpectedly accepted';
  exception when insufficient_privilege then null; end;
end $$;

-- TASK-040: game_commit_maintenance copies the exact current row (signed only when the tip matches) before writing.
set local role service_role;
do $$
declare r jsonb; again jsonb; b public.game_save_backups%rowtype; s public.game_saves%rowtype;
 receipt jsonb := jsonb_build_object('request_id','55555555-5555-4555-8555-555555555555','request_hash',repeat('c',64),'content_hash',repeat('e',64),'outcome','committed','command_type','account.reset','committed_revision','2','server_at','2026-10-20T00:00:00Z');
begin
  begin
    perform public.game_commit_maintenance('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555',repeat('c',64),9,'reset','66666666-6666-4666-8666-666666666666','{"fresh":true}'::jsonb,repeat('d',64),receipt,'sig2',1,1,'new-content','new-rules',repeat('e',64),'test','local-isolated-fixture');
    raise exception 'Stale maintenance revision unexpectedly accepted';
  exception when raise_exception then if sqlerrm <> 'REVISION_CONFLICT' then raise; end if; end;
  r := public.game_commit_maintenance('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555',repeat('c',64),1,'reset','66666666-6666-4666-8666-666666666666','{"fresh":true}'::jsonb,repeat('d',64),receipt,'sig2',1,1,'new-content','new-rules',repeat('e',64),'test','local-isolated-fixture');
  select * into b from public.game_save_backups where account_id='22222222-2222-4222-8222-222222222222' and backup_id='66666666-6666-4666-8666-666666666666';
  if b.revision <> 1 or b.state <> '{"fixture":"SQL storage permissions only"}'::jsonb or b.signature <> 'test-signature' or b.content_hash <> repeat('a',64) then raise exception 'Maintenance backup did not copy the signed current row'; end if;
  select * into s from public.game_saves where account_id='22222222-2222-4222-8222-222222222222';
  if s.revision <> 2 or s.state <> '{"fresh":true}'::jsonb or s.content_hash <> repeat('e',64) or s.content_version <> 'new-content' then raise exception 'Maintenance write failed'; end if;
  if (select count(*) from public.game_battle_checkpoints where account_id='22222222-2222-4222-8222-222222222222') <> 0 then raise exception 'Maintenance kept a battle'; end if;
  if (select signature from public.game_save_history where account_id='22222222-2222-4222-8222-222222222222' and revision=2) <> 'sig2' then raise exception 'Maintenance history missing'; end if;
  again := public.game_commit_maintenance('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555',repeat('c',64),1,'reset','99999999-9999-4999-8999-999999999999','{"other":true}'::jsonb,repeat('f',64),receipt,'sig3',1,1,'x','x',repeat('e',64),'test','local-isolated-fixture');
  if again <> r or (select revision from public.game_saves where account_id='22222222-2222-4222-8222-222222222222') <> 2 or (select count(*) from public.game_save_backups where account_id='22222222-2222-4222-8222-222222222222') <> 2 then raise exception 'Maintenance replay wrote twice'; end if;
end $$;
rollback;
select 'SQL ownership/grants/RPC/environment tests passed; Supabase Auth still untested' as result;
