create or replace function public.get_partner_id(user_id_input uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select member.id
  from public.profiles viewer
  inner join public.profiles member
    on member.active_couple_id = viewer.active_couple_id
   and member.id <> viewer.id
  where viewer.id = coalesce(user_id_input, auth.uid())
  order by member.created_at asc
  limit 1;
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
    and c.status = 'active'
  limit 1;

  if existing_couple.id is not null then
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
  is_first_join boolean;
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
    and public.couples.partner_one_id <> current_user_id
  for update;

  if target_couple.id is null then
    raise exception 'Invite code not found or already used.';
  end if;

  is_first_join := target_couple.paired_at is null;

  update public.couples
  set
    partner_two_id = coalesce(partner_two_id, current_user_id),
    paired_at = coalesce(paired_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where id = target_couple.id;

  update public.profiles
  set active_couple_id = target_couple.id
  where id = current_user_id;

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
    case when is_first_join then 'Your universe connected' else 'Your universe grew' end,
    case
      when is_first_join then 'You paired up and unlocked your shared little world.'
      else 'Someone new joined and the shared little world got bigger.'
    end,
    'milestone',
    timezone('utc', now()),
    jsonb_build_object(
      'milestone',
      case when is_first_join then 'paired' else 'member_joined' end
    )
  );

  return query
  select target_couple.id, target_couple.invite_code;
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
  notification_title text;
  notification_body text;
  notification_kind public.notification_type;
  source_couple_id uuid;
begin
  if tg_table_name = 'ideas' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'idea_added';
    notification_title := 'something new landed';
    notification_body := format(
      '%s added "%s" to your dream board.',
      coalesce((select nickname from public.profiles where id = new.created_by), 'Someone'),
      new.title
    );
  elsif tg_table_name = 'votes' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'vote_started';
    notification_title := 'vote started';
    notification_body := format(
      '%s started a new vote: %s',
      coalesce((select nickname from public.profiles where id = new.created_by), 'Someone'),
      new.prompt
    );
  elsif tg_table_name = 'memories' then
    actor_user_id := new.created_by;
    source_couple_id := new.couple_id;
    notification_kind := 'surprise_unlocked';
    notification_title := 'surprise unlocked';
    notification_body := format(
      '%s added a new memory: %s',
      coalesce((select nickname from public.profiles where id = new.created_by), 'Someone'),
      new.title
    );
  elsif tg_table_name = 'messages' then
    actor_user_id := new.sender_id;
    source_couple_id := new.couple_id;
    notification_kind := 'message_received';
    notification_title := 'new message';
    notification_body := left(new.content, 80);
  else
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
  select
    profile.id,
    source_couple_id,
    actor_user_id,
    notification_kind,
    notification_title,
    notification_body
  from public.profiles profile
  where profile.active_couple_id = source_couple_id
    and profile.id <> actor_user_id;

  return new;
end;
$$;

drop policy if exists "profiles_select_self_or_partner" on public.profiles;
create policy "profiles_select_self_or_partner"
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or (
      active_couple_id is not null
      and active_couple_id = public.get_active_couple_id(auth.uid())
    )
  );

grant execute on function public.get_partner_id(uuid) to authenticated;
grant execute on function public.create_couple_invite() to authenticated;
grant execute on function public.join_couple_with_code(text) to authenticated;
