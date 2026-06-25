create table if not exists finance_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  file_name text not null,
  storage_path text not null,
  period_label text not null,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

alter table finance_uploads enable row level security;
drop policy if exists "finance_uploads_v1_read" on finance_uploads;
create policy "finance_uploads_v1_read" on finance_uploads for select using (true);
drop policy if exists "finance_uploads_v1_write" on finance_uploads;
create policy "finance_uploads_v1_write" on finance_uploads for all using (true) with check (true);

create table if not exists dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  upload_id uuid references finance_uploads(id),
  period_label text not null,
  ebit_actual numeric not null,
  ebit_budget numeric not null,
  ebit_variance numeric not null,
  gross_profit_pct numeric not null,
  total_fee_revenue numeric not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

alter table dashboard_snapshots enable row level security;
drop policy if exists "dashboard_snapshots_v1_read" on dashboard_snapshots;
create policy "dashboard_snapshots_v1_read" on dashboard_snapshots for select using (true);
drop policy if exists "dashboard_snapshots_v1_write" on dashboard_snapshots;
create policy "dashboard_snapshots_v1_write" on dashboard_snapshots for all using (true) with check (true);

create table if not exists team_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  snapshot_id uuid references dashboard_snapshots(id),
  team_name text not null,
  fee_revenue numeric not null,
  gross_profit_pct numeric not null,
  rag_status text not null,
  rag_reason text,
  rag_status_source text not null default 'rule_engine',
  rag_status_confidence numeric not null default 1.0,
  rag_status_review_status text not null default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table team_metrics enable row level security;
drop policy if exists "team_metrics_v1_read" on team_metrics;
create policy "team_metrics_v1_read" on team_metrics for select using (true);
drop policy if exists "team_metrics_v1_write" on team_metrics;
create policy "team_metrics_v1_write" on team_metrics for all using (true) with check (true);

create table if not exists project_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  snapshot_id uuid references dashboard_snapshots(id),
  project_code text not null,
  project_name text not null,
  team_name text not null,
  flag_type text not null,
  wip_value numeric,
  overrun_pct numeric,
  rag_status text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table project_flags enable row level security;
drop policy if exists "project_flags_v1_read" on project_flags;
create policy "project_flags_v1_read" on project_flags for select using (true);
drop policy if exists "project_flags_v1_write" on project_flags;
create policy "project_flags_v1_write" on project_flags for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  object_type text not null,
  object_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into finance_uploads (id, file_name, storage_path, period_label, status) values
  ('a1000000-0000-0000-0000-000000000001', 'finance_mar_2025.csv', 'demo/finance_mar_2025.csv', 'Mar 2025', 'complete'),
  ('a1000000-0000-0000-0000-000000000002', 'finance_apr_2025.csv', 'demo/finance_apr_2025.csv', 'Apr 2025', 'complete'),
  ('a1000000-0000-0000-0000-000000000003', 'finance_may_2025.csv', 'demo/finance_may_2025.csv', 'May 2025', 'complete')
on conflict (id) do nothing;

insert into dashboard_snapshots (id, upload_id, period_label, ebit_actual, ebit_budget, ebit_variance, gross_profit_pct, total_fee_revenue, is_current) values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Mar 2025', 390000, 500000, -110000, 35.4, 1100000, false),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Apr 2025', 455000, 500000, -45000, 37.1, 1230000, false),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'May 2025', 420000, 500000, -80000, 38.2, 1185000, true)
on conflict (id) do nothing;

insert into team_metrics (snapshot_id, team_name, fee_revenue, gross_profit_pct, rag_status, rag_reason, rag_status_source, rag_status_confidence, rag_status_review_status) values
  ('b1000000-0000-0000-0000-000000000003', 'Advisory', 420000, 41.0, 'green', null, 'rule_engine', 1.0, 'unreviewed'),
  ('b1000000-0000-0000-0000-000000000003', 'Planning', 310000, 36.5, 'amber', 'EBIT variance at -6% vs budget', 'rule_engine', 1.0, 'unreviewed'),
  ('b1000000-0000-0000-0000-000000000003', 'Engineering', 280000, 33.8, 'red', 'EBIT variance at -18% vs budget', 'rule_engine', 1.0, 'unreviewed'),
  ('b1000000-0000-0000-0000-000000000003', 'Sustainability', 175000, 42.1, 'green', null, 'rule_engine', 1.0, 'unreviewed')
on conflict (id) do nothing;

insert into project_flags (snapshot_id, project_code, project_name, team_name, flag_type, wip_value, overrun_pct, rag_status, notes) values
  ('b1000000-0000-0000-0000-000000000003', 'P-0042', 'Changi Masterplan', 'Engineering', 'billing_delay', 95000, null, 'red', 'Unbilled >75 days'),
  ('b1000000-0000-0000-0000-000000000003', 'P-0078', 'Jurong Lake District Study', 'Planning', 'overrun', null, 18.5, 'red', 'Fee overrun 18.5% above contract value'),
  ('b1000000-0000-0000-0000-000000000003', 'P-0091', 'Marina Bay Public Realm', 'Advisory', 'high_wip', 52000, null, 'amber', 'WIP building — invoice due next month')
on conflict (id) do nothing;