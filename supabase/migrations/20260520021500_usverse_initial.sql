create extension if not exists pgcrypto;

do $$
begin
  create type public.couple_status as enum ('active', 'unlinked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.theme_preference as enum (
    'rosewater',
    'peach-fizz',
    'mint-meringue',
    'starlit-lagoon'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.idea_status as enum ('pending', 'shortlisted', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vote_mode as enum ('yes_no', 'emoji', 'rating', 'vibe');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.vote_status as enum ('active', 'closed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum (
    'idea_added',
    'vote_started',
    'surprise_unlocked',
    'message_received',
    'system'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.mood_name as enum (
    'hungry',
    'bored',
    'romantic',
    'adventurous',
    'tired',
    'movie_mood',
    'lazy',
    'excited'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.game_type as enum (
    'this_or_that',
    'would_you_rather',
    'spin_the_wheel',
    'partner_quiz',
    'emoji_guessing'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  partner_one_id uuid not null references auth.users(id) on delete cascade,
  partner_two_id uuid references auth.users(id) on delete cascade,
  invite_code text not null,
  status public.couple_status not null default 'active',
  paired_at timestamptz,
  unlinked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couples_distinct_partners check (
    partner_two_id is null or partner_one_id <> partner_two_id
  )
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  emoji_identity text not null,
  avatar_key text not null,
  theme_preference public.theme_preference not null default 'rosewater',
  bio text,
  active_couple_id uuid references public.couples(id) on delete set null,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  emoji text not null default '✨',
  tags text[] not null default '{}',
  image_url text,
  priority_weight smallint not null default 1 check (priority_weight between 1 and 5),
  status public.idea_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  prompt text not null,
  mode public.vote_mode not null,
  status public.vote_status not null default 'active',
  options jsonb not null default '[]'::jsonb,
  closes_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vote_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  vote_id uuid not null references public.votes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response_value text,
  rating_value smallint check (rating_value between 1 and 5),
  emoji_value text,
  comment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vote_responses_one_per_user unique (vote_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_by uuid[] not null default '{}',
  reaction_map jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood public.mood_name not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  related_idea_id uuid references public.ideas(id) on delete set null,
  related_vote_id uuid references public.votes(id) on delete set null,
  title text not null,
  description text,
  memory_type text not null default 'memory',
  celebration_level smallint not null default 1 check (celebration_level between 1 and 5),
  cover_url text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type public.notification_type not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  game_type public.game_type not null,
  prompt text not null,
  state jsonb not null default '{}'::jsonb,
  winner_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists couples_invite_code_active_idx
  on public.couples (invite_code)
  where status = 'active';

create unique index if not exists couples_partner_one_active_idx
  on public.couples (partner_one_id)
  where status = 'active';

create unique index if not exists couples_partner_two_active_idx
  on public.couples (partner_two_id)
  where partner_two_id is not null and status = 'active';

create index if not exists profiles_active_couple_idx
  on public.profiles (active_couple_id);

create index if not exists ideas_couple_created_idx
  on public.ideas (couple_id, created_at desc);

create index if not exists votes_couple_created_idx
  on public.votes (couple_id, created_at desc);

create index if not exists vote_responses_couple_created_idx
  on public.vote_responses (couple_id, created_at desc);

create index if not exists messages_couple_created_idx
  on public.messages (couple_id, created_at desc);

create index if not exists moods_couple_created_idx
  on public.moods (couple_id, created_at desc);

create index if not exists memories_couple_occurred_idx
  on public.memories (couple_id, occurred_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists game_sessions_couple_created_idx
  on public.game_sessions (couple_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.get_active_couple_id(user_id_input uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select active_couple_id
  from public.profiles
  where id = coalesce(user_id_input, auth.uid());
$$;

create or replace function public.get_partner_id(user_id_input uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when c.partner_one_id = coalesce(user_id_input, auth.uid()) then c.partner_two_id
      else c.partner_one_id
    end
  from public.couples c
  inner join public.profiles p on p.active_couple_id = c.id
  where p.id = coalesce(user_id_input, auth.uid())
    and c.status = 'active'
  limit 1;
$$;

create or replace function public.is_couple_member(
  couple_id_input uuid,
  user_id_input uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = coalesce(user_id_input, auth.uid())
      and active_couple_id = couple_id_input
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_theme public.theme_preference;
begin
  chosen_theme :=
    case
      when new.raw_user_meta_data ->> 'themePreference' in (
        'rosewater',
        'peach-fizz',
        'mint-meringue',
        'starlit-lagoon'
      ) then (new.raw_user_meta_data ->> 'themePreference')::public.theme_preference
      else 'rosewater'
    end;

  insert into public.profiles (
    id,
    nickname,
    emoji_identity,
    avatar_key,
    theme_preference
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'emojiIdentity', 'Soft Chaos ✨'),
    coalesce(new.raw_user_meta_data ->> 'avatarKey', 'peach-cat'),
    chosen_theme
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.create_couple_invite()
returns table (couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_couple public.couples%rowtype;
  generated_code text;
  created_couple_id uuid;
  created_invite_code text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  select c.*
  into existing_couple
  from public.couples c
  inner join public.profiles p on p.active_couple_id = c.id
  where p.id = current_user_id
  limit 1;

  if existing_couple.id is not null then
    if existing_couple.partner_two_id is not null then
      raise exception 'You are already paired.';
    end if;

    return query
    select existing_couple.id, existing_couple.invite_code;
    return;
  end if;

  loop
    generated_code := upper(
      substring(
        md5(
          current_user_id::text
          || clock_timestamp()::text
          || random()::text
        )
        from 1 for 6
      )
    );
    exit when not exists (
      select 1
      from public.couples c
      where c.invite_code = generated_code
        and c.status = 'active'
    );
  end loop;

  insert into public.couples as created_couple (
    created_by,
    partner_one_id,
    invite_code
  )
  values (
    current_user_id,
    current_user_id,
    generated_code
  )
  returning created_couple.id, created_couple.invite_code
  into created_couple_id, created_invite_code;

  update public.profiles
  set active_couple_id = created_couple_id
  where id = current_user_id;

  return query
  select created_couple_id, created_invite_code;
end;
$$;

create or replace function public.join_couple_with_code(invite_code_input text)
returns table (couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_couple public.couples%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if public.get_active_couple_id(current_user_id) is not null then
    raise exception 'You are already paired.';
  end if;

  select *
  into target_couple
  from public.couples
  where public.couples.invite_code = upper(trim(invite_code_input))
    and public.couples.status = 'active'
    and public.couples.partner_two_id is null
    and public.couples.partner_one_id <> current_user_id
  for update;

  if target_couple.id is null then
    raise exception 'Invite code not found or already used.';
  end if;

  update public.couples
  set
    partner_two_id = current_user_id,
    paired_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = target_couple.id;

  update public.profiles
  set active_couple_id = target_couple.id
  where id in (target_couple.partner_one_id, current_user_id);

  insert into public.memories (
    couple_id,
    created_by,
    title,
    description,
    memory_type,
    occurred_at,
    metadata
  )
  values (
    target_couple.id,
    current_user_id,
    'Your universe connected',
    'You paired up and unlocked your shared little world.',
    'milestone',
    timezone('utc', now()),
    jsonb_build_object('milestone', 'paired')
  );

  return query
  select target_couple.id, target_couple.invite_code;
end;
$$;

create or replace function public.unlink_couple()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_couple_id uuid := public.get_active_couple_id(current_user_id);
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if current_couple_id is null then
    return false;
  end if;

  update public.couples
  set
    status = 'unlinked',
    unlinked_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = current_couple_id;

  update public.profiles
  set active_couple_id = null
  where active_couple_id = current_couple_id;

  return true;
end;
$$;

create or replace function public.push_partner_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid;
  partner_user_id uuid;
  actor_name text;
  notification_title text;
  notification_body text;
  notification_kind public.notification_type;
  source_couple_id uuid;
begin
  if tg_table_name = 'ideas' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'idea_added';
    notification_title := 'partner added something 👀';
    notification_body := format('%s added "%s" to your dream board.', coalesce((select nickname from public.profiles where id = new.created_by), 'Your partner'), new.title);
  elsif tg_table_name = 'votes' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'vote_started';
    notification_title := 'vote started 🎉';
    notification_body := format('%s started a new vote: %s', coalesce((select nickname from public.profiles where id = new.created_by), 'Your partner'), new.prompt);
  elsif tg_table_name = 'memories' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'surprise_unlocked';
    notification_title := 'surprise unlocked ✨';
    notification_body := format('%s added a new memory: %s', coalesce((select nickname from public.profiles where id = new.created_by), 'Your partner'), new.title);
  elsif tg_table_name = 'messages' then
    actor_user_id := new.sender_id;
    source_couple_id := new.couple_id;
    notification_kind := 'message_received';
    notification_title := 'new message 💌';
    notification_body := left(new.content, 80);
  else
    return new;
  end if;

  select
    case
      when c.partner_one_id = actor_user_id then c.partner_two_id
      else c.partner_one_id
    end
  into partner_user_id
  from public.couples c
  where c.id = source_couple_id
  limit 1;

  if partner_user_id is null or partner_user_id = actor_user_id then
    return new;
  end if;

  insert into public.notifications (
    user_id,
    couple_id,
    actor_id,
    type,
    title,
    body
  )
  values (
    partner_user_id,
    source_couple_id,
    actor_user_id,
    notification_kind,
    notification_title,
    notification_body
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists couples_set_updated_at on public.couples;
create trigger couples_set_updated_at
  before update on public.couples
  for each row execute procedure public.set_updated_at();

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
  before update on public.ideas
  for each row execute procedure public.set_updated_at();

drop trigger if exists votes_set_updated_at on public.votes;
create trigger votes_set_updated_at
  before update on public.votes
  for each row execute procedure public.set_updated_at();

drop trigger if exists vote_responses_set_updated_at on public.vote_responses;
create trigger vote_responses_set_updated_at
  before update on public.vote_responses
  for each row execute procedure public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
  before update on public.messages
  for each row execute procedure public.set_updated_at();

drop trigger if exists game_sessions_set_updated_at on public.game_sessions;
create trigger game_sessions_set_updated_at
  before update on public.game_sessions
  for each row execute procedure public.set_updated_at();

drop trigger if exists ideas_notify_partner on public.ideas;
create trigger ideas_notify_partner
  after insert on public.ideas
  for each row execute procedure public.push_partner_notification();

drop trigger if exists votes_notify_partner on public.votes;
create trigger votes_notify_partner
  after insert on public.votes
  for each row execute procedure public.push_partner_notification();

drop trigger if exists memories_notify_partner on public.memories;
create trigger memories_notify_partner
  after insert on public.memories
  for each row execute procedure public.push_partner_notification();

drop trigger if exists messages_notify_partner on public.messages;
create trigger messages_notify_partner
  after insert on public.messages
  for each row execute procedure public.push_partner_notification();

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.ideas enable row level security;
alter table public.votes enable row level security;
alter table public.vote_responses enable row level security;
alter table public.messages enable row level security;
alter table public.moods enable row level security;
alter table public.memories enable row level security;
alter table public.notifications enable row level security;
alter table public.game_sessions enable row level security;

drop policy if exists "profiles_select_self_or_partner" on public.profiles;
create policy "profiles_select_self_or_partner"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or id = public.get_partner_id(auth.uid()));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "couples_select_members" on public.couples;
create policy "couples_select_members"
  on public.couples
  for select
  to authenticated
  using (
    partner_one_id = auth.uid()
    or partner_two_id = auth.uid()
    or id = public.get_active_couple_id(auth.uid())
  );

drop policy if exists "ideas_select_couple_members" on public.ideas;
create policy "ideas_select_couple_members"
  on public.ideas
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "ideas_insert_couple_members" on public.ideas;
create policy "ideas_insert_couple_members"
  on public.ideas
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "ideas_update_couple_members" on public.ideas;
create policy "ideas_update_couple_members"
  on public.ideas
  for update
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "votes_select_couple_members" on public.votes;
create policy "votes_select_couple_members"
  on public.votes
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "votes_insert_couple_members" on public.votes;
create policy "votes_insert_couple_members"
  on public.votes
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "votes_update_couple_members" on public.votes;
create policy "votes_update_couple_members"
  on public.votes
  for update
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "vote_responses_select_couple_members" on public.vote_responses;
create policy "vote_responses_select_couple_members"
  on public.vote_responses
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "vote_responses_insert_couple_members" on public.vote_responses;
create policy "vote_responses_insert_couple_members"
  on public.vote_responses
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "vote_responses_update_couple_members" on public.vote_responses;
create policy "vote_responses_update_couple_members"
  on public.vote_responses
  for update
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid())
  with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());

drop policy if exists "messages_select_couple_members" on public.messages;
create policy "messages_select_couple_members"
  on public.messages
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "messages_insert_couple_members" on public.messages;
create policy "messages_insert_couple_members"
  on public.messages
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and sender_id = auth.uid()
  );

drop policy if exists "messages_update_couple_members" on public.messages;
create policy "messages_update_couple_members"
  on public.messages
  for update
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "moods_select_couple_members" on public.moods;
create policy "moods_select_couple_members"
  on public.moods
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "moods_insert_couple_members" on public.moods;
create policy "moods_insert_couple_members"
  on public.moods
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and user_id = auth.uid()
  );

drop policy if exists "memories_select_couple_members" on public.memories;
create policy "memories_select_couple_members"
  on public.memories
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "memories_insert_couple_members" on public.memories;
create policy "memories_insert_couple_members"
  on public.memories
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "notifications_select_owner" on public.notifications;
create policy "notifications_select_owner"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications_update_owner" on public.notifications;
create policy "notifications_update_owner"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "game_sessions_select_couple_members" on public.game_sessions;
create policy "game_sessions_select_couple_members"
  on public.game_sessions
  for select
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists "game_sessions_insert_couple_members" on public.game_sessions;
create policy "game_sessions_insert_couple_members"
  on public.game_sessions
  for insert
  to authenticated
  with check (
    public.is_couple_member(couple_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists "game_sessions_update_couple_members" on public.game_sessions;
create policy "game_sessions_update_couple_members"
  on public.game_sessions
  for update
  to authenticated
  using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));

grant execute on function public.get_active_couple_id(uuid) to authenticated;
grant execute on function public.get_partner_id(uuid) to authenticated;
grant execute on function public.is_couple_member(uuid, uuid) to authenticated;
grant execute on function public.create_couple_invite() to authenticated;
grant execute on function public.join_couple_with_code(text) to authenticated;
grant execute on function public.unlink_couple() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vote_responses'
  ) then
    alter publication supabase_realtime add table public.vote_responses;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ideas'
  ) then
    alter publication supabase_realtime add table public.ideas;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
