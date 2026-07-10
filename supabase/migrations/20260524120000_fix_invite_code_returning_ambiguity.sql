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

grant execute on function public.create_couple_invite() to authenticated;
