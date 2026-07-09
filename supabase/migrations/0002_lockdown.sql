-- Sprint 4 lock-down (docs/SECURITY.md): dashboard reads stay public,
-- writes require an authenticated user. Server API routes use the service
-- role (bypasses RLS); these policies close direct anon-key writes.

-- finance_uploads
drop policy if exists "finance_uploads_v1_write" on finance_uploads;
create policy "finance_uploads_auth_write" on finance_uploads
  for all to authenticated
  using (user_id is null or auth.uid() = user_id)
  with check (user_id is null or auth.uid() = user_id);

-- dashboard_snapshots
drop policy if exists "dashboard_snapshots_v1_write" on dashboard_snapshots;
create policy "dashboard_snapshots_auth_write" on dashboard_snapshots
  for all to authenticated
  using (user_id is null or auth.uid() = user_id)
  with check (user_id is null or auth.uid() = user_id);

-- team_metrics
drop policy if exists "team_metrics_v1_write" on team_metrics;
create policy "team_metrics_auth_write" on team_metrics
  for all to authenticated
  using (user_id is null or auth.uid() = user_id)
  with check (user_id is null or auth.uid() = user_id);

-- project_flags
drop policy if exists "project_flags_v1_write" on project_flags;
create policy "project_flags_auth_write" on project_flags
  for all to authenticated
  using (user_id is null or auth.uid() = user_id)
  with check (user_id is null or auth.uid() = user_id);

-- audit_logs: append-only — inserts only for authenticated; no update/delete
-- policy exists, so the anon/authenticated roles can never modify history.
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_auth_insert" on audit_logs
  for insert to authenticated
  with check (true);
