-- =============================================================================
-- supabase/migrations/001_create_nudges.sql: creates the Nudge repository table
--
-- What it does: creates the "nudges" table that holds the 9 nudges (one row
-- each). The owner edits its content in the Supabase dashboard. The database
-- itself refuses badly formed rows, using the same rules as the app's checks in
-- shared/nudge-repository.ts (spec v1.3 to v1.5).
--
-- How to apply: the owner opens Supabase > SQL Editor, pastes this whole file
-- and clicks Run. Run it once only (running again fails because the table
-- already exists, which is safe: nothing is changed).
--
-- SQL (Structured Query Language) is the language databases understand.
-- "--" starts a comment, which the database ignores.
-- =============================================================================

create table public.nudges (
  -- ID: a whole number the database generates (1, 2, 3...). "generated always"
  -- means nobody can type their own ID, so IDs can never be duplicated.
  id bigint generated always as identity primary key,

  -- The nudge's name, e.g. "Descriptive praise". Must not be blank.
  name text not null check (btrim(name) <> ''),

  -- "quick" (1 to 2 minutes) or "deliberate" (more time). Nothing else.
  category text not null check (category in ('quick', 'deliberate')),

  -- The 5 examples. None may be blank.
  example_1 text not null check (btrim(example_1) <> ''),
  example_2 text not null check (btrim(example_2) <> ''),
  example_3 text not null check (btrim(example_3) <> ''),
  example_4 text not null check (btrim(example_4) <> ''),
  example_5 text not null check (btrim(example_5) <> ''),

  -- Yes/no columns ("boolean" = true or false; empty is not allowed).
  self_report_allowed boolean not null,

  -- Longest optional description a parent may add when logging (1 to 280).
  description_max_chars integer not null default 280
    check (description_max_chars between 1 and 280),

  photo_upload_allowed boolean not null,

  -- What to photograph. Required only when photos are allowed (rule below).
  photo_idea text,

  -- No = retired: parents can't pick it, but its history stays.
  active boolean not null default true,

  -- No = a parent must unlock it before picking it.
  starts_unlocked boolean not null,

  -- When the row was added (filled in automatically).
  created_at timestamptz not null default now(),

  -- Rules that compare two columns:
  -- a nudge that allows photos needs a photo idea...
  constraint photo_idea_required_when_photos_allowed
    check (not photo_upload_allowed or (photo_idea is not null and btrim(photo_idea) <> '')),
  -- ...and every nudge needs at least one way to log.
  constraint at_least_one_way_to_log
    check (self_report_allowed or photo_upload_allowed)
);

-- No two nudges may share a name. Capitals and extra spaces are ignored, so
-- "Showing affection" and "  showing  AFFECTION" count as the same name.
create unique index nudges_name_unique
  on public.nudges (lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));

-- Security: Supabase can publish tables on the internet through its automatic
-- web interface (the "Data API"). Turning on Row Level Security (RLS) with no
-- rules means nobody gets in that way by default.
alter table public.nudges enable row level security;

-- Only our own server code (which signs in with the secret "service role" key,
-- kept in Vercel) may READ nudges. Nobody may add, change or delete rows
-- through the Data API; the owner edits them in the dashboard instead.
-- (Supabase requires this permission to be granted explicitly.)
revoke all on public.nudges from anon, authenticated;
grant select on public.nudges to service_role;

-- A short note stored with the table, visible in the Supabase dashboard.
comment on table public.nudges is
  'Nudge repository: the 9 nudges. Edit content here; rules are enforced. Retire with active = false instead of deleting.';
