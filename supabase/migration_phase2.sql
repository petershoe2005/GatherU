-- ============================================================
-- GatherU Phase 2 Migration
-- Run this in Supabase SQL Editor (NOT the full schema.sql)
-- ============================================================

-- 1. Extend profiles table with Phase 2 columns
alter table public.profiles
  add column if not exists trust_score numeric default 0,
  add column if not exists badges text[] default '{}',
  add column if not exists school_name text default '';

-- 2. Extend items table with listing type & buy-now
alter table public.items
  add column if not exists listing_type text default 'auction'
    check (listing_type in ('auction', 'fixed', 'both')),
  add column if not exists buy_now_price numeric,
  add column if not exists allow_offers boolean default false;

-- 3. Notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text default 'system' check (type in ('bid', 'outbid', 'message', 'sold', 'order', 'system', 'review')),
  title text not null,
  body text default '',
  read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Policies (use DROP IF EXISTS to be idempotent)
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "System can insert notifications" on public.notifications;
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- 4. Favorites table
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Users can view their own favorites" on public.favorites;
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own favorites" on public.favorites;
create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- 5. Reports table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reported_item_id uuid references public.items(id) on delete cascade,
  reason text not null,
  details text default '',
  status text default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

drop policy if exists "Users can submit reports" on public.reports;
create policy "Users can submit reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- 6. Trigger: auto-notify on new bids
create or replace function public.notify_on_bid()
returns trigger as $$
begin
  -- Notify seller of new bid
  insert into public.notifications (user_id, type, title, body, data)
  select i.seller_id, 'bid',
         'New bid on "' || i.title || '"',
         'Someone bid $' || NEW.amount || ' on your listing',
         jsonb_build_object('item_id', NEW.item_id, 'bid_id', NEW.id, 'amount', NEW.amount)
  from public.items i where i.id = NEW.item_id and i.seller_id != NEW.bidder_id;

  -- Notify previous highest bidder they've been outbid
  insert into public.notifications (user_id, type, title, body, data)
  select b.bidder_id, 'outbid',
         'You''ve been outbid!',
         'Someone placed a higher bid of $' || NEW.amount || ' on an item you bid on',
         jsonb_build_object('item_id', NEW.item_id, 'amount', NEW.amount)
  from public.bids b
  where b.item_id = NEW.item_id
    and b.bidder_id != NEW.bidder_id
    and b.amount = (
      select max(b2.amount) from public.bids b2
      where b2.item_id = NEW.item_id and b2.id != NEW.id
    )
  limit 1;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_bid_notify on public.bids;
create trigger on_bid_notify
  after insert on public.bids
  for each row execute function public.notify_on_bid();

-- 7. Trigger: auto-notify on new messages
create or replace function public.notify_on_message()
returns trigger as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  select case
    when c.buyer_id = NEW.sender_id then c.seller_id
    else c.buyer_id
  end into recipient_id
  from public.conversations c where c.id = NEW.conversation_id;

  select p.name into sender_name
  from public.profiles p where p.id = NEW.sender_id;

  if recipient_id is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      recipient_id, 'message',
      'New message from ' || coalesce(sender_name, 'someone'),
      left(NEW.text, 100),
      jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id)
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_notify on public.messages;
create trigger on_message_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- 8. Enable Realtime for new tables
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.favorites;

-- 9. Reviews table
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text default '',
  created_at timestamptz default now(),
  unique(reviewer_id, item_id)
);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can submit reviews" on public.reviews;
create policy "Users can submit reviews"
  on public.reviews for insert
  with check (auth.uid() = reviewer_id);

-- 10. Create Storage bucket for item images (idempotent)
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated uploads" on storage.objects;
create policy "Authenticated uploads"
  on storage.objects for insert
  with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

drop policy if exists "Public access" on storage.objects;
create policy "Public access"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- Done! ✅
