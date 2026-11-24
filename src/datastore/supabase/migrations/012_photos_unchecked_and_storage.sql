-- =============================================================================
-- Migration 012: log photos without a check, and the private photo store
--
-- What it does, in plain English: [2026-11-24] the owner parked the photo
-- check (src/photo-check/SPEC.md, "Parked"): whatever a parent sends after a
-- log is saved, with no Claude check. So:
--   1. A log's photo may now be "not_checked" (before, only a moment photo
--      could be). A moment photo is still always "not_checked" (B2, Q11).
--   2. The private photo store: a Supabase Storage "bucket" (a folder in the
--      cloud) called "photos", never public, JPEG only (Telegram sends photos
--      as JPEG), at most 10 MB a file. Files live in one folder per parent,
--      named by the parent's number ("7/…jpg").
--   3. Locks on that store (Row Level Security on Supabase's storage table):
--      a parent's pass (the Web app, rule 9.8) can read and delete only the
--      files in its own parent's folder: read to make a short-lived link for
--      My page, delete for the dustbin. The bot saves files with our server
--      key, which Supabase lets past these locks; nobody else can reach them.
-- Run once, in Supabase's SQL Editor, after 011 (docs/CONTEXT.md, "How to run
-- and test"). Tests: src/datastore/supabase/tests/web-app-access.test.sql
-- (T119, T120).
-- =============================================================================

-- ---- 1. A log's photo may be "not checked" -----------------------------------
-- The old rule ("a log photo is always checked") was written without a name,
-- so it is found by what it says and removed, then replaced by the new one.
do $$
declare c text;
begin
  select conname into c from pg_constraint
   where conrelid = 'public.photos'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%log_id IS NOT NULL%not_checked%';
  if c is null then raise exception 'The old photo check rule was not found.'; end if;
  execute format('alter table public.photos drop constraint %I', c);
end $$;
alter table public.photos add constraint photos_moment_never_checked check (moment_week is null or check_result = 'not_checked');
comment on column public.photos.check_result is
  'passed, failed (Claude judged it did not fit), error (the check could not run) or not_checked (a moment photo, or a log photo while the check is parked, owner 24 Nov).';

-- ---- 2. The private photo store ---------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 10485760, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg'];

-- ---- 3. Locks: a pass reaches only its own parent's folder --------------------
-- storage.foldername('7/abc.jpg') gives {'7'}: the first folder is the parent's number.
create policy web_own_photo_files_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.pass_parent_id()::text);
create policy web_own_photo_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.pass_parent_id()::text);
