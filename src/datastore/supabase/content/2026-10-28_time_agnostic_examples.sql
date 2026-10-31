-- =============================================================================
-- src/datastore/supabase/content/2026-10-28_time_agnostic_examples.sql
--
-- What it does: rewrites 10 examples that had a time of day baked in (e.g.
-- "at dinner", "before bedtime"), so Claude can fit any example to whenever a
-- nudge message is sent (spec v1.7). Only the example TEXT changes: IDs, codes
-- and the active flag stay the same, so the 3-example guard is not involved.
--
-- Safety: each row is updated only if its text is still exactly the original.
-- If you have already edited an example yourself, that row is left alone.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run.
-- Expected result: a list of 10 rows (the updated examples). Fewer than 10
-- means some rows were already edited; tell Claude which IDs are missing.
-- This is a one-off content change, not a migration (it changes data, not the
-- table structure).
-- =============================================================================

update public.examples as e
set example = v.new_text
from (values
  (1, 'Ask "What was the best part of your day?" on the way home from school.',
       'Ask "What was the best part of your day?" and listen to the full answer.'),
  (2, 'Ask "What made you laugh today?" at dinner.',
       'Ask "What made you laugh today?"'),
  (5, 'At bedtime, ask "Is there anything on your mind?" and just listen.',
       'Ask "Is there anything on your mind?" and just listen.'),
  (6, 'Give a hug when your child leaves for school and when you reunite.',
       'Give a hug when you say goodbye and again when you meet up.'),
  (7, 'Say "I love you" before bedtime.',
       'Say "I love you", face to face.'),
  (9, 'Leave a small sticky note with a smiley in their bag or lunchbox.',
       'Leave a small sticky note with a smiley where your child will find it.'),
  (21, 'Eat dinner together with all phones put away.',
       'Share a meal together with all phones put away.'),
  (22, 'Play one round of a board or card game after homework.',
       'Play one round of a board or card game together.'),
  (23, 'Take a 15-minute evening walk around the neighbourhood together.',
       'Take a 15-minute walk around the neighbourhood together.'),
  (30, 'Have a family craft night, such as painting or making DIY (Do-It-Yourself) cards.',
       'Have a family craft session, such as painting or making DIY (Do-It-Yourself) cards.')
) as v(id, old_text, new_text)
where e.id = v.id
  and e.example = v.old_text   -- only if nobody has edited it since
returning e.id, e.nudge_code, e.example;
