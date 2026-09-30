-- Account deletion follows the existing private-data lifecycle; restart still only archives.
alter table public.learner_memories drop constraint learner_memories_user_id_fkey;
alter table public.learner_memories add constraint learner_memories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table public.learner_memories drop constraint learner_memories_journey_id_user_id_fkey;
alter table public.learner_memories add constraint learner_memories_journey_id_user_id_fkey
  foreign key (journey_id, user_id) references public.learning_journeys(id, user_id) on delete cascade;
