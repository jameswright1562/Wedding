do $$
begin
  if to_regclass('public.wedding_rsvps') is not null then
    truncate table public.wedding_rsvps restart identity;
  end if;
end
$$;
