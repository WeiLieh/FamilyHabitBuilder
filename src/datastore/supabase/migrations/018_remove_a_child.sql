-- =============================================================================
-- src/datastore/supabase/migrations/018_remove_a_child.sql: remove a child in Settings
--
-- What it does: [2026-11-26 SGT] the owner found in UAT (U86, 26 Nov) that a
-- child added by mistake can't be taken back. The owner decided (26 Nov, "all
-- as recommended"): each child on My page's Settings gets a dustbin; removing
-- deletes that child AND every earlier name of theirs for good (a renamed
-- child keeps its old names as history rows, linked by replaces_id), so no
-- name is left behind (Singapore's Personal Data Protection Act, PDPA); a
-- parent's last child can't be removed; an event "child_removed" is written
-- (with no name in it). Rule 8.4 edit 17 (Settings) gains "remove a child".
--
-- Why it is built this way:
--   * One new function, web_remove_child, owned by the narrow writer role
--     web_page_writer like the other Settings changes (migration 016), so it
--     runs behind Row Level Security: it can only see and delete the pass's
--     own parent's children (a new delete policy, for that parent only).
--   * The child is found among the parent's CURRENT children (a row no newer
--     row replaces). Then every row in its chain of names is collected by
--     walking replaces_id back to the first one, and all are deleted at once.
--   * Earlier migrations have already run on the real project, so none is
--     edited (rule B1). Everything is one transaction: all or nothing.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 017. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/web-app-access.test.sql (T147 to T150).
-- =============================================================================

begin;

-- ---- 1. A new event type (no name in any event) -------------------------------
insert into public.event_types (name, meaning, metric) values
  ('child_removed', 'A parent removed a child, with every earlier name of theirs (Settings).', null);

-- ---- 2. The change ------------------------------------------------------------
-- Remove one of the pass's parent's current children, with all its earlier
-- names. Refused for a child of someone else (not found) and for the last one.
create function public.web_remove_child(p_child bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        current_children int;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  -- Hold the parent's row until the end, so two removals at the same moment
  -- (two open tabs) wait in line and can't both pass "at least 1 child"
  -- (privacy review, Low, 26 Nov).
  perform 1 from parents where id = me for update;
  -- The child must be one of this parent's current children (not an old name).
  if not exists (select 1 from children c
                  where c.id = p_child and c.parent_id = me
                    and not exists (select 1 from children r where r.replaces_id = c.id)) then
    raise exception 'That child was not found.';
  end if;
  -- How many current children the parent has: at least 1 must stay.
  select count(*) into current_children from children c
   where c.parent_id = me and not exists (select 1 from children r where r.replaces_id = c.id);
  if current_children <= 1 then raise exception 'Please keep at least 1 child.'; end if;
  -- The whole chain of names: this row, the row it replaced, and so on back.
  with recursive chain(id, replaces_id) as (
    select c.id, c.replaces_id from children c where c.id = p_child and c.parent_id = me
    union all
    select c.id, c.replaces_id from children c join chain on c.id = chain.replaces_id where c.parent_id = me
  )
  delete from children where id in (select id from chain);
  perform write_event(me, 'child_removed', p_version, p_variants);
end $$;

-- ---- 3. Owner, lock and rights (as in migration 016) ---------------------------
grant web_page_writer to current_user;
grant usage, create on schema public to web_page_writer;
alter function public.web_remove_child(bigint, bigint, jsonb) owner to web_page_writer;
revoke create on schema public from web_page_writer;
revoke web_page_writer from current_user;
-- The writer may delete only the pass's parent's children.
create policy web_writer_children_remove on public.children for delete to web_page_writer
  using (parent_id = public.pass_parent_id());
grant delete on public.children to web_page_writer;
revoke all on function public.web_remove_child(bigint, bigint, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.web_remove_child(bigint, bigint, jsonb) to authenticated;
comment on role web_page_writer is 'Runs the Web app''s narrow deletes and Settings changes (rule 8.4 edits 6, 11 to 13, 17, with remove a child since migration 018). Cannot sign in; still behind Row Level Security.';

commit;
