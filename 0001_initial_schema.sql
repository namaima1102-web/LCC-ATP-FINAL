-- Milestone M1: Khởi tạo toàn bộ bảng dữ liệu (theo Phần 10 PRD)

create extension if not exists pgcrypto;

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  starts_on date,
  ends_on date,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  name text not null,
  color text,
  sort_order int not null default 0,
  unique (season_id, name)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  full_name text unique not null,
  nickname text,
  active boolean not null default true
);

create table if not exists season_players (
  season_id uuid references seasons on delete cascade,
  player_id uuid references players,
  team_id uuid not null references teams,
  rating_start numeric(4,1) not null,
  rating_end numeric(4,1),
  is_provisional boolean not null default false,
  primary key (season_id, player_id)
);

create table if not exists handicap_rules (
  season_id uuid references seasons on delete cascade,
  diff numeric(3,1) not null,
  singles_code text not null,
  doubles_code text not null,
  note text,
  primary key (season_id, diff)
);

create table if not exists periods (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  period_no int not null,
  name text,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  published_at timestamptz,
  closed_at timestamptz,
  unique (season_id, period_no)
);

create table if not exists alert_log (
  id bigserial primary key,
  period_id uuid not null references periods on delete cascade,
  days_before int not null,
  channel text not null,
  backlog_count int not null,
  completion_pct numeric(5,2),
  sent_at timestamptz not null default now()
);

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  team_a_id uuid not null references teams,
  team_b_id uuid not null references teams,
  check (team_a_id <> team_b_id)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons on delete cascade,
  fixture_id uuid not null references fixtures on delete cascade,
  kind text not null check (kind in ('singles','doubles')),
  sets_to_win int not null,
  period_id uuid not null references periods,
  status text not null default 'scheduled' check (status in ('scheduled','played','forfeit','cancelled')),
  handicap_diff numeric(3,1),
  handicap_code text,
  handicap_giver char(1) check (handicap_giver in ('a','b')),
  created_at timestamptz not null default now()
);

create table if not exists match_sides (
  match_id uuid references matches on delete cascade,
  side char(1) check (side in ('a','b')),
  player_id uuid references players,
  primary key (match_id, side, player_id)
);

create table if not exists score_submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches on delete cascade,
  submitted_by_player_id uuid references players,
  sets_a int not null,
  sets_b int not null,
  set_details jsonb,
  evidence_path text,
  note text,
  played_on date,
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded')),
  ip_hash text,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users,
  reviewed_at timestamptz,
  review_note text
);

create table if not exists results (
  match_id uuid primary key references matches on delete cascade,
  sets_a int not null,
  sets_b int not null,
  set_details jsonb,
  played_on date,
  table_no int,
  winner_side char(1) check (winner_side in ('a','b')),
  is_forfeit boolean not null default false,
  forfeit_kind text check (forfeit_kind in ('winner_a','winner_b','both')),
  source_submission_id uuid references score_submissions,
  approved_by uuid references auth.users,
  approved_at timestamptz not null default now()
);

create table if not exists rating_decisions (
  season_id uuid references seasons,
  player_id uuid references players,
  from_rating numeric(4,1),
  rule_rating numeric(4,1),
  final_rating numeric(4,1) not null,
  reason text,
  decided_by uuid references auth.users,
  decided_at timestamptz default now(),
  primary key (season_id, player_id)
);

create table if not exists audit_log (
  id bigserial primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text,
  at timestamptz not null default now()
);

create table if not exists attendance (
  season_id uuid references seasons on delete cascade,
  player_id uuid references players,
  on_date date not null,
  checked_in_at timestamptz not null default now(),
  primary key (season_id, player_id, on_date)
);

create table if not exists admins (
  user_id uuid primary key references auth.users,
  display_name text
);

-- Indexes phục vụ truy vấn nhanh
create index if not exists idx_matches_season_period on matches (season_id, period_id);
create index if not exists idx_matches_status on matches (status);
create index if not exists idx_submissions_match_status on score_submissions (match_id, status);
create index if not exists idx_audit_entity on audit_log (entity, entity_id);
