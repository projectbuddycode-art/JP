alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permission_overrides enable row level security;
alter table public.login_events enable row level security;
alter table public.lead_assignment_history enable row level security;
alter table public.report_definitions enable row level security;
alter table public.report_schedules enable row level security;
alter table public.report_runs enable row level security;
alter table public.report_deliveries enable row level security;
alter table public.approvals enable row level security;
alter table public.approval_history enable row level security;
alter table public.suppliers enable row level security;
alter table public.trip_operations enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.bootstrap_state enable row level security;

create policy permissions_read on public.permissions for select to authenticated using (public.is_active_user());
create policy role_permissions_read on public.role_permissions for select to authenticated using (public.is_active_user());
create policy role_permissions_owner on public.role_permissions for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());

create policy overrides_owner on public.user_permission_overrides for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());
create policy overrides_self_read on public.user_permission_overrides for select to authenticated
  using (profile_id = auth.uid() or public.is_owner_user());

create policy login_events_owner on public.login_events for select to authenticated
  using (public.is_owner_user() or profile_id = auth.uid());

create policy assignment_history_read on public.lead_assignment_history for select to authenticated
  using (public.is_active_user());
create policy assignment_history_insert on public.lead_assignment_history for insert to authenticated
  with check (public.is_active_user());

create policy reports_read on public.report_definitions for select to authenticated using (public.is_active_user());
create policy reports_write on public.report_definitions for insert to authenticated with check (public.is_active_user());
create policy reports_update on public.report_definitions for update to authenticated using (public.is_owner_user());

create policy report_schedules_owner on public.report_schedules for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());
create policy report_runs_read on public.report_runs for select to authenticated using (public.is_active_user());
create policy report_deliveries_owner on public.report_deliveries for select to authenticated using (public.is_owner_user());

create policy approvals_read on public.approvals for select to authenticated using (public.is_active_user());
create policy approvals_insert on public.approvals for insert to authenticated with check (public.is_active_user());
create policy approvals_update on public.approvals for update to authenticated using (public.is_active_user());
create policy approval_history_read on public.approval_history for select to authenticated using (public.is_active_user());
create policy approval_history_insert on public.approval_history for insert to authenticated with check (public.is_active_user());

create policy suppliers_read on public.suppliers for select to authenticated using (public.is_active_user());
create policy suppliers_write on public.suppliers for all to authenticated
  using (public.is_owner_user()) with check (public.is_owner_user());
create policy trip_ops_read on public.trip_operations for select to authenticated using (public.is_active_user());
create policy trip_ops_write on public.trip_operations for insert to authenticated with check (public.is_active_user());
create policy feedback_read on public.customer_feedback for select to authenticated using (public.is_active_user());
create policy feedback_insert on public.customer_feedback for insert to authenticated with check (public.is_active_user());

-- Bootstrap state is service-role only.
revoke all on public.bootstrap_state from anon, authenticated, public;

drop policy if exists audit_logs_delete on public.audit_logs;
drop policy if exists audit_logs_update on public.audit_logs;
create policy audit_logs_insert_system on public.audit_logs for insert to authenticated
  with check (public.is_active_user());

create or replace function public.can_view_all_leads()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active'
      and p.workspace_role in ('owner', 'admin')
  );
$$;

drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads for select to authenticated
  using (
    public.is_active_user() and (
      public.can_view_all_leads()
      or owner_id = auth.uid()
    )
  );

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using (
    public.is_active_user() and (public.can_view_all_leads() or owner_id = auth.uid())
  )
  with check (
    public.is_active_user() and (public.can_view_all_leads() or owner_id = auth.uid())
  );

drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete to authenticated
  using (public.is_owner_user());
