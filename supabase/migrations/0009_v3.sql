-- V3 consolidation. Additive. No data reset.

alter table public.profiles drop constraint if exists profiles_workspace_role_check;
alter table public.profiles
  add constraint profiles_workspace_role_check
  check (workspace_role in (
    'owner', 'admin', 'partner', 'sales', 'viewer', 'trip_leader', 'finance', 'operations_manager'
  ));
