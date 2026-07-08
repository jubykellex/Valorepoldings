-- Valore Operating Portal — Postgres schema (Supabase-ready, multi-tenant)
-- Every business table carries org_id so the internal tool can become SaaS with no rewrite.
-- Apply in Supabase SQL editor or via `supabase db push`. Enable RLS policies before going live.

create extension if not exists "pgcrypto";

-- Tenants
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'internal',         -- internal | starter | pro | portfolio
  created_at timestamptz default now()
);

-- Users (mirror of auth.users with app role + tenant)
create table if not exists app_users (
  id uuid primary key,                            -- = auth.users.id
  org_id uuid references organisations(id) on delete cascade,
  email text,
  role text not null default 'analyst',           -- admin | analyst | investor | provider
  created_at timestamptz default now()
);

-- Properties (assembled from open data + commercial enrichment)
create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  uprn text, address text, postcode text,
  lat double precision, lng double precision,
  beds int, property_type text,
  epc_rating text, council_tax_band text,
  flood_risk text, article4_flag boolean default false,
  region text, admin_district text, imd_rank int,
  last_sold_price numeric, last_sold_date date,
  source text, created_at timestamptz default now()
);

-- Deals
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  property_id uuid references properties(id),
  strategy text not null,                         -- r2sh_single | r2sh_hmo | brr | source
  status text not null default 'pipeline',        -- pipeline | live | ended
  owner_user_id uuid references app_users(id),
  purchase_price numeric, gdv numeric, refurb_cost numeric,
  net_month numeric, net_year numeric, money_left_in numeric,
  score int, verdict text,
  inputs jsonb, outputs jsonb,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  type text,                                      -- landlord | investor | provider
  name text, contact text, location text, message text,
  source text, status text default 'new',
  created_at timestamptz default now()
);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  name text, type text,                           -- HA | council | TA | support
  contacts jsonb, areas text[], needs_notes text,
  created_at timestamptz default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  property_id uuid references properties(id),
  provider_id uuid references providers(id),
  lease_start date, lease_end date,
  rent_in numeric, rent_out numeric,
  status text default 'pipeline',
  created_at timestamptz default now()
);

create table if not exists compliance_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  type text,                                      -- gas | EICR | EPC | HMO_licence | fire
  expires_on date, doc_url text, status text default 'ok',
  created_at timestamptz default now()
);

create table if not exists investors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  user_id uuid references app_users(id),
  name text, kyc_status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  investor_id uuid references investors(id),
  deal_id uuid references deals(id),
  amount numeric, terms jsonb, status text default 'proposed',
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  deal_id uuid references deals(id), unit_id uuid references units(id),
  kind text, url text,                            -- pack | LOI | report | cert
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  unit_id uuid references units(id),
  direction text,                                 -- in | out
  amount numeric, due_on date, paid_on date,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id bigserial primary key,
  org_id uuid, user_id uuid, action text, entity text, meta jsonb,
  ts timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- ROW-LEVEL SECURITY (multi-tenant isolation). Enable + add policies per table.
-- Pattern: a user may only see rows for their own org. helper: current_org()
-- ---------------------------------------------------------------------------
create or replace function current_org() returns uuid language sql stable as $$
  select org_id from app_users where id = auth.uid()
$$;

do $$
declare t text;
begin
  foreach t in array array['properties','deals','leads','providers','units',
      'compliance_items','investors','investments','documents','payments'] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$create policy %1$s_isolation on %1$I
      using (org_id = current_org()) with check (org_id = current_org());$f$, t);
  end loop;
end $$;

-- Seed tenant #1
insert into organisations (name, plan) values ('Valore Property Holdings','internal')
  on conflict do nothing;
