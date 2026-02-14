-- ============================================
-- Housing & Apartments Extension
-- ============================================

-- 1. Add housing columns to items table
do $$
begin
  -- Housing Type (e.g., Apartment, Room, House)
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'housing_type') then
    alter table public.items add column housing_type text check (housing_type in ('apartment', 'room', 'sublet', 'house'));
  end if;

  -- Lease Details
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'lease_start') then
    alter table public.items add column lease_start date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'lease_end') then
    alter table public.items add column lease_end date;
  end if;
  
  -- Rent Period (e.g., /month, /semester)
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'rent_period') then
    alter table public.items add column rent_period text default 'month' check (rent_period in ('month', 'semester', 'year', 'total'));
  end if;

  -- Amenities
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'is_furnished') then
    alter table public.items add column is_furnished boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'utilities_included') then
    alter table public.items add column utilities_included boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'sqft') then
    alter table public.items add column sqft int;
  end if;
end $$;

-- 2. Update category check constraint (optional, depending on if you have a strict check)
-- This is often hard to do safely in postgres without dropping the constraint first.
-- Assuming frontend handles the 'category' text field, but if there's a DB constraint:
-- alter table public.items drop constraint if exists items_category_check;
-- alter table public.items add constraint items_category_check check (category in ('tech', 'furniture', 'apparel', 'textbooks', 'housing', 'other'));
