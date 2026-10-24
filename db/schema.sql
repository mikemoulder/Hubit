-- Hubit's database: what the stores said and when, and the orders placed.
-- The catalogue itself stays in the committed snapshot; this records change.
-- Every row says which deployment wrote it (production, preview, development),
-- so test runs on previews never colour production's history.
-- RLS is on with no policies: only the server, with the service role, reads or writes.

create table if not exists source_status (
  env text not null,
  source_id text not null,
  name text not null,
  platform text not null,
  last_attempt_at timestamptz,
  last_ok_at timestamptz,
  last_error text,
  listings integer,
  primary key (env, source_id)
);

create table if not exists price_points (
  id bigserial primary key,
  env text not null,
  product_id text not null,
  source_id text not null,
  listing_id text not null,
  price_cents integer not null,
  available boolean not null,
  origin text not null check (origin in ('snapshot', 'sync', 'recheck')),
  seen_at timestamptz not null default now()
);
create index if not exists price_points_product on price_points (product_id, seen_at);

create table if not exists sync_runs (
  id bigserial primary key,
  env text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  sources_ok integer not null default 0,
  sources_failed integer not null default 0,
  points integer not null default 0
);

create table if not exists orders (
  invoice_id text primary key,
  env text not null,
  number text,
  total_cents integer not null,
  placed_by text not null check (placed_by in ('human', 'agent')),
  created_at timestamptz not null default now()
);

create table if not exists order_lines (
  id bigserial primary key,
  invoice_id text not null references orders (invoice_id) on delete cascade,
  product_id text not null,
  option text not null,
  qty integer not null,
  unit_cents integer not null,
  source_id text not null,
  listing_id text not null
);

alter table source_status enable row level security;
alter table price_points enable row level security;
alter table sync_runs enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
