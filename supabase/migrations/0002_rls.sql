create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
  );
$$;

create or replace function public.is_owner_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.role = 'owner'
  );
$$;

create or replace function public.claim_first_owner(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where role = 'owner' and status = 'active') then
    raise exception 'An owner already exists';
  end if;
  if target_id is distinct from auth.uid() and auth.role() <> 'service_role' then
    raise exception 'Cannot claim owner for another user';
  end if;
  perform set_config('app.allow_role_change', 'true', true);
  update public.profiles
    set role = 'owner', status = 'active'
    where id = target_id;
end;
$$;

revoke all on function public.claim_first_owner(uuid) from public, anon, authenticated;
grant execute on function public.claim_first_owner(uuid) to service_role;

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and (new.role is distinct from old.role) then
    if current_setting('app.allow_role_change', true) is distinct from 'true' then
      raise exception 'Role changes must use the owner bootstrap process';
    end if;
  end if;
  return new;
end;
$$;

alter table public.profiles enable row level security;
alter table public.team_invites enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.lead_stages enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.packages enable row level security;
alter table public.package_media enable row level security;
alter table public.trip_enquiries enable row level security;
alter table public.bookings enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_templates enable row level security;
alter table public.consent_records enable row level security;
alter table public.suppression_list enable row level security;
alter table public.campaign_attribution enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_platforms enable row level security;
alter table public.social_metrics enable row level security;
alter table public.automation_workflows enable row level security;
alter table public.automation_executions enable row level security;
alter table public.jobs enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_secrets enable row level security;
alter table public.integration_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_user());
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy team_invites_owner on public.team_invites for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());

create policy settings_read on public.workspace_settings for select to authenticated
  using (public.is_active_user());
create policy settings_owner_write on public.workspace_settings for update to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());

create policy stages_read on public.lead_stages for select to authenticated
  using (public.is_active_user());
create policy stages_owner_write on public.lead_stages for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());

create policy packages_public_read on public.packages for select to anon
  using (status = 'published');
create policy package_media_public_read on public.package_media for select to anon
  using (exists (select 1 from public.packages p where p.id = package_id and p.status = 'published'));

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts','campaigns','leads','lead_stage_history','packages','package_media',
    'trip_enquiries','bookings','proposals','proposal_items','activities','tasks',
    'conversations','messages','message_templates','consent_records','suppression_list',
    'campaign_attribution','social_accounts','social_posts','social_post_platforms',
    'social_metrics','automation_workflows','automation_executions','integration_connections',
    'integration_events','audit_logs'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_active_user())',
      tbl || '_read', tbl
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_active_user())',
      tbl || '_insert', tbl
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_active_user()) with check (public.is_active_user())',
      tbl || '_update', tbl
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_owner_user())',
      tbl || '_delete', tbl
    );
  end loop;
end $$;

drop policy if exists automation_workflows_insert on public.automation_workflows;
drop policy if exists automation_workflows_update on public.automation_workflows;
drop policy if exists integration_connections_insert on public.integration_connections;
drop policy if exists integration_connections_update on public.integration_connections;
drop policy if exists social_accounts_insert on public.social_accounts;
drop policy if exists social_accounts_update on public.social_accounts;

create policy automation_workflows_write on public.automation_workflows for insert to authenticated
  with check (public.is_owner_user());
create policy automation_workflows_owner_update on public.automation_workflows for update to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());
create policy integration_connections_owner_update on public.integration_connections for update to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());
create policy social_accounts_owner_write on public.social_accounts for insert to authenticated
  with check (public.is_owner_user());
create policy social_accounts_owner_update on public.social_accounts for update to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());

create policy jobs_owner_read on public.jobs for select to authenticated
  using (public.is_owner_user());

create policy notifications_own on public.notifications for select to authenticated
  using (profile_id = auth.uid());
create policy notifications_own_update on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Secrets are service-role only. No authenticated policies on purpose.
revoke all on public.integration_secrets from anon, authenticated, public;
