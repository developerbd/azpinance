-- Create Audit Logs Table
create table if not exists expense_audit_logs (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references digital_expenses(id) on delete cascade not null,
  performed_by uuid references users(id) not null,
  performed_by_name text, -- Optional: Snapshot of name in case user is deleted, or just join.
  action text not null, -- 'Created', 'Updated', 'Approved', 'Rejected'
  change_log jsonb default '{}'::jsonb,
  timestamp timestamptz default now()
);

-- Index for faster queries
create index idx_expense_audit_logs_expense_id on expense_audit_logs(expense_id);
create index idx_expense_audit_logs_timestamp on expense_audit_logs(timestamp desc);
