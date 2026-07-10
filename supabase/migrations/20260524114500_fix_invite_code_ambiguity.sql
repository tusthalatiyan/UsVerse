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

grant execute on function public.create_couple_invite() to authenticated;
grant execute on function public.join_couple_with_code(text) to authenticated;
