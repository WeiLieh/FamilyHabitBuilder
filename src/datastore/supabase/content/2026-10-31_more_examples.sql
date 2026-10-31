-- =============================================================================
-- src/datastore/supabase/content/2026-10-31_more_examples.sql
--
-- What it does: adds 32 new examples to the examples table (decision D6, agreed
-- by the owner on 31 Oct): 7 from the v0.1 surprise cards (TWC, SGE, SQT, IAC)
-- and 25 new drafts (5 each for SAF, DPR, GAT, ITE, ASD), approved "for now"
-- (content review is in docs/PRODUCT-BACKLOG.md). All are time-agnostic
-- (rule 4.5). The same rows are in seed/examples-first-load.csv.
--
-- Safety: an example is added only if that nudge does not already have the
-- exact same text, so running this twice adds nothing the second time. Adding
-- examples never triggers the 3-example guard (it only checks removals).
--
-- How to apply: Supabase > SQL Editor > paste this file > Run.
-- Expected result: a list of 32 rows (the new examples, with their new IDs).
-- Fewer than 32 means some were already there; 0 means it had already run.
-- This is a one-off content change, not a migration (it adds data, not
-- table structure). New IDs follow the order listed below, the same order as
-- the seed file.
-- =============================================================================

insert into public.examples (nudge_code, example)
select v.nudge_code, v.example
from (values
  (1, 'TWC', 'Ask your child to teach you something they learned this week, and ask a follow-up question.'),
  (2, 'TWC', 'Tell your child about something you were proud of when you were their age.'),
  (3, 'TWC', 'Pick a song together and each say what it reminds you of.'),
  (4, 'SGE', 'Share one small thing that was tricky for you today and what you did about it.'),
  (5, 'SQT', 'Play three rounds of "would you rather" with silly choices.'),
  (6, 'IAC', 'Take turns drawing each other in 60 seconds, with no judging.'),
  (7, 'IAC', 'Build a three-sentence story together, one sentence each.'),
  (8, 'SAF', 'Give a long hug and count to ten before letting go.'),
  (9, 'SAF', 'Hold their hand while you walk together, even for a short stretch.'),
  (10, 'SAF', 'Invent a secret handshake or special wave that''s just for the two of you.'),
  (11, 'SAF', 'Give a thumbs-up and a big smile across the room when they catch your eye.'),
  (12, 'SAF', 'Offer a gentle back rub or head scratch while they relax.'),
  (13, 'DPR', '"You kept your voice down while your sister was resting. That was thoughtful."'),
  (14, 'DPR', '"You helped your friend work it out instead of just giving the answer. That was patient."'),
  (15, 'DPR', '"I saw you put your shoes neatly on the rack. Thank you for taking care of our home."'),
  (16, 'DPR', '"You tried a new food even though you weren''t sure. That was brave."'),
  (17, 'DPR', '"You said sorry and meant it. That takes courage."'),
  (18, 'GAT', 'Stop what you''re doing and turn your whole body towards them when they speak.'),
  (19, 'GAT', 'Crouch or sit at their eye level when they want to show you something.'),
  (20, 'GAT', 'Say back what they told you in your own words ("So you felt left out when...") to show you were listening.'),
  (21, 'GAT', 'Look closely at their drawing, homework or toy and name one detail you like.'),
  (22, 'GAT', 'Let them finish their whole story without interrupting, even if it wanders.'),
  (23, 'ITE', 'At the hawker centre, let them read the menu board and work out the total cost of your order (maths and money skills).'),
  (24, 'ITE', 'When you see a long word on a sign, ask them to sound it out and guess what it means (reading).'),
  (25, 'ITE', 'At a pedestrian crossing, ask them why we wait for the green man (safety and rules).'),
  (26, 'ITE', 'When something breaks at home, ask them to guess the cause and what to try first (problem solving).'),
  (27, 'ITE', 'When you look at the sky together, ask what shape a cloud looks like and what it might do next (curiosity).'),
  (28, 'ASD', 'Ask: "Can you help me wipe the table?" Say: "Wipe one way, then the other way." Do: wipe one half together, then let them do the rest.'),
  (29, 'ASD', 'Ask: "Want to help sort the recycling?" Say: "Clean paper, plastic bottles and cans go in the blue bin." Do: sort the first few items together.'),
  (30, 'ASD', 'Ask: "Can you help me pack your sports bag?" Say: "Tick off each item on the list." Do: pack the first item together.'),
  (31, 'ASD', 'Ask: "Shall we make your bed together?" Say: "Pull the sheet flat, then the blanket." Do: fix one side together, then let them do the other.'),
  (32, 'ASD', 'Ask: "Can you help carry the groceries?" Say: "Hold the bag with both hands." Do: carry one bag side by side.')
) as v(position, nudge_code, example)
where not exists (            -- only if this nudge doesn't have it already
  select 1 from public.examples e
  where e.nudge_code = v.nudge_code and e.example = v.example
)
order by v.position          -- keep the listed order, so new IDs match the seed file
returning id, nudge_code, example;
