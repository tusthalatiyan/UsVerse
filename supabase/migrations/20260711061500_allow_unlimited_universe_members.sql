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
    raise exception 'You are already in a shared universe.';
  end if;

  select *
  into target_couple
  from public.couples
  where public.couples.invite_code = upper(trim(invite_code_input))
    and public.couples.status = 'active'
    and public.couples.partner_one_id <> current_user_id
  for update;

  if target_couple.id is null then
    raise exception 'Invite code not found.';
  end if;

  is_first_join := target_couple.paired_at is null;

  update public.couples
  set
    partner_two_id = coalesce(partner_two_id, current_user_id),
    paired_at = coalesce(paired_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  where id = target_couple.id;

  update public.profiles
  set
    active_couple_id = target_couple.id,
    updated_at = timezone('utc', now())
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
      when is_first_join then 'You connected and unlocked your shared little world.'
      else 'Someone new joined and the shared little world got bigger.'
    end,
    'milestone',
    timezone('utc', now()),
    jsonb_build_object(
      'milestone',
      case when is_first_join then 'connected' else 'member_joined' end
    )
  );

  return query
  select target_couple.id, target_couple.invite_code;
end;
$$;

grant execute on function public.join_couple_with_code(text) to authenticated;
