-- ==============================================================================
-- NabungPintar - Supabase PostgreSQL Database Schema
-- Version 1.0 (Asia/Jakarta WIB Timezone Standard, IDR Base Currency)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: categories
-- ------------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  icon text not null default 'tag',
  color text not null default '#8FA0BF',
  is_default boolean not null default false,
  monthly_budget bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- ------------------------------------------------------------------------------
-- 2. Table: import_batches
-- ------------------------------------------------------------------------------
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  rows_saved int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. Table: transactions
-- ------------------------------------------------------------------------------
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  amount_original bigint not null check (amount_original > 0),
  currency char(3) not null default 'IDR',
  fx_rate_to_idr numeric(18,6) not null default 1,
  amount_base bigint not null check (amount_base > 0),
  category_id uuid references categories(id) on delete set null,
  note text,
  occurred_on date not null,
  import_batch_id uuid references import_batches(id) on delete cascade,
  import_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on transactions (user_id, occurred_on desc);
create unique index if not exists idx_transactions_user_import_hash on transactions (user_id, import_hash) where import_hash is not null;

-- ------------------------------------------------------------------------------
-- 4. Table: savings_goals
-- ------------------------------------------------------------------------------
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount bigint not null check (target_amount > 0),
  deadline date,
  icon text not null default 'piggy-bank',
  color text not null default '#2DD4A7',
  custom_image text,
  image_display_mode text not null default 'both',
  reminder_enabled boolean not null default false,
  reminder_time text not null default '20:00',
  reminder_frequency text not null default 'daily',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_savings_goals_user on savings_goals (user_id, archived);

-- ------------------------------------------------------------------------------
-- 5. Table: savings_entries
-- ------------------------------------------------------------------------------
create table if not exists savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  kind text not null check (kind in ('topup', 'withdraw')),
  amount bigint not null check (amount > 0),
  note text,
  occurred_on date not null default (now() at time zone 'Asia/Jakarta')::date,
  created_at timestamptz not null default now()
);

create index if not exists idx_savings_entries_goal_date on savings_entries (goal_id, occurred_on);
create index if not exists idx_savings_entries_user on savings_entries (user_id, occurred_on desc);

-- ------------------------------------------------------------------------------
-- 6. Table: user_settings
-- ------------------------------------------------------------------------------
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_currency char(3) not null default 'IDR',
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  hide_balance boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
alter table categories enable row level security;
alter table import_batches enable row level security;
alter table transactions enable row level security;
alter table savings_goals enable row level security;
alter table savings_entries enable row level security;
alter table user_settings enable row level security;

-- Policies for categories
create policy "Users can manage own categories" on categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for import_batches
create policy "Users can manage own import batches" on import_batches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for transactions
create policy "Users can manage own transactions" on transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for savings_goals
create policy "Users can manage own savings goals" on savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for savings_entries
create policy "Users can manage own savings entries" on savings_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Policies for user_settings
create policy "Users can manage own user settings" on user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ==============================================================================
-- Triggers & Automations
-- ==============================================================================

-- 1. Automatic updated_at timestamp trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_transactions_updated_at
  before update on transactions
  for each row execute function handle_updated_at();

create or replace trigger trg_user_settings_updated_at
  before update on user_settings
  for each row execute function handle_updated_at();

-- 2. New User Registration: Seed default categories & user settings
create or replace function handle_new_user_setup()
returns trigger as $$
begin
  -- Initialize user settings
  insert into public.user_settings (user_id, display_currency, theme)
  values (new.id, 'IDR', 'system')
  on conflict (user_id) do nothing;

  -- Initialize default Expense categories
  insert into public.categories (user_id, name, kind, icon, color, is_default)
  values
    (new.id, 'Makanan', 'expense', 'restaurant', '#2DD4A7', true),
    (new.id, 'Transportasi', 'expense', 'directions_car', '#38BDF8', true),
    (new.id, 'Belanja', 'expense', 'shopping_bag', '#FBBF24', true),
    (new.id, 'Tagihan', 'expense', 'receipt_long', '#F87171', true),
    (new.id, 'Hiburan', 'expense', 'sports_esports', '#C084FC', true),
    (new.id, 'Kesehatan', 'expense', 'favorite', '#34D399', true),
    (new.id, 'Pendidikan', 'expense', 'school', '#60A5FA', true),
    (new.id, 'Lainnya', 'expense', 'more_horiz', '#8FA0BF', true)
  on conflict (user_id, kind, name) do nothing;

  -- Initialize default Income categories
  insert into public.categories (user_id, name, kind, icon, color, is_default)
  values
    (new.id, 'Gaji', 'income', 'payments', '#2DD4A7', true),
    (new.id, 'Bonus', 'income', 'savings', '#34D399', true),
    (new.id, 'Usaha', 'income', 'storefront', '#FBBF24', true),
    (new.id, 'Investasi', 'income', 'trending_up', '#60A5FA', true),
    (new.id, 'Lainnya', 'income', 'more_horiz', '#8FA0BF', true)
  on conflict (user_id, kind, name) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_setup();

-- ==============================================================================
-- RPC: dashboard_summary(p_days int)
-- Calculates dashboard summary metrics on the server in a single round-trip
-- ==============================================================================
create or replace function dashboard_summary(p_days int default 30)
returns json as $$
declare
  v_user_id uuid;
  v_today date;
  v_curr_start date;
  v_curr_end date;
  v_prev_start date;
  v_prev_end date;

  v_current_income bigint := 0;
  v_current_expense bigint := 0;
  v_prev_income bigint := 0;
  v_prev_expense bigint := 0;

  v_total_all_income bigint := 0;
  v_total_all_expense bigint := 0;
  v_total_all_topup bigint := 0;
  v_total_all_withdraw bigint := 0;

  v_saldo_kas bigint := 0;
  v_total_tabungan bigint := 0;
  v_total_saldo bigint := 0;

  v_daily_cashflow json;
  v_result json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Current date in Asia/Jakarta timezone
  v_today := (now() at time zone 'Asia/Jakarta')::date;
  v_curr_end := v_today;
  v_curr_start := v_today - (p_days - 1);

  v_prev_end := v_curr_start - 1;
  v_prev_start := v_curr_start - p_days;

  -- 1. Current period income & expense
  select
    coalesce(sum(case when kind = 'income' then amount_base else 0 end), 0),
    coalesce(sum(case when kind = 'expense' then amount_base else 0 end), 0)
  into v_current_income, v_current_expense
  from transactions
  where user_id = v_user_id
    and occurred_on between v_curr_start and v_curr_end;

  -- 2. Previous period income & expense
  select
    coalesce(sum(case when kind = 'income' then amount_base else 0 end), 0),
    coalesce(sum(case when kind = 'expense' then amount_base else 0 end), 0)
  into v_prev_income, v_prev_expense
  from transactions
  where user_id = v_user_id
    and occurred_on between v_prev_start and v_prev_end;

  -- 3. All-time transactions for Saldo Kas & Total Saldo
  select
    coalesce(sum(case when kind = 'income' then amount_base else 0 end), 0),
    coalesce(sum(case when kind = 'expense' then amount_base else 0 end), 0)
  into v_total_all_income, v_total_all_expense
  from transactions
  where user_id = v_user_id;

  -- 4. All-time savings entries for Saldo Kas & Total Tabungan
  select
    coalesce(sum(case when kind = 'topup' then amount else 0 end), 0),
    coalesce(sum(case when kind = 'withdraw' then amount else 0 end), 0)
  into v_total_all_topup, v_total_all_withdraw
  from savings_entries
  where user_id = v_user_id;

  -- Formulas:
  -- Saldo Kas = SUM(income) - SUM(expense) - SUM(topup) + SUM(withdraw)
  -- Total Tabungan = SUM(topup) - SUM(withdraw)
  -- Total Saldo = Saldo Kas + Total Tabungan = SUM(income) - SUM(expense)
  v_total_tabungan := v_total_all_topup - v_total_all_withdraw;
  v_saldo_kas := v_total_all_income - v_total_all_expense - v_total_tabungan;
  v_total_saldo := v_saldo_kas + v_total_tabungan;

  -- 5. Daily Cashflow series for the selected timeframe
  select json_agg(day_series)
  into v_daily_cashflow
  from (
    select
      d.day::text as date,
      coalesce(sum(case when t.kind = 'income' then t.amount_base else 0 end), 0) as income,
      coalesce(sum(case when t.kind = 'expense' then t.amount_base else 0 end), 0) as expense
    from generate_series(v_curr_start, v_curr_end, interval '1 day') as d(day)
    left join transactions t
      on t.user_id = v_user_id
      and t.occurred_on = d.day::date
    group by d.day
    order by d.day asc
  ) day_series;

  -- Build resulting JSON
  v_result := json_build_object(
    'period_days', p_days,
    'current_income', v_current_income,
    'current_expense', v_current_expense,
    'prev_income', v_prev_income,
    'prev_expense', v_prev_expense,
    'saldo_kas', v_saldo_kas,
    'total_tabungan', v_total_tabungan,
    'total_saldo', v_total_saldo,
    'daily_cashflow', coalesce(v_daily_cashflow, '[]'::json)
  );

  return v_result;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- Realtime Configuration
-- ==============================================================================
-- Add tables to realtime publication (wrapped in DO block to handle duplicate gracefully)
do $$
begin
  execute 'alter publication supabase_realtime add table transactions, categories, savings_goals, savings_entries, user_settings';
exception when others then
  null; -- Ignore if publication or table already added
end $$;

