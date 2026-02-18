-- ============================================
-- GatherU Campus Marketplace - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  username text unique default '',
  email text default '',
  avatar_url text default '',
  institution text default '',
  rating numeric(2,1) default 0.0,
  reviews_count int default 0,
  is_verified boolean default false,
  location text default 'Palo Alto',
  gps_radius int default 5,
  accept_cash boolean default true,
  bidding_alerts boolean default true,
  message_alerts boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. ITEMS TABLE
-- ============================================
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  category text default 'other',
  starting_price numeric(10,2) not null default 0,
  current_bid numeric(10,2) default 0,
  images text[] default '{}',
  distance text default '0.1 mi',
  location text default 'Palo Alto',
  time_left text default '3d',
  status text default 'active' check (status in ('active', 'sold', 'ended')),
  view_count int default 0,
  active_bidders int default 0,
  payment_method text default 'cash',
  ends_at timestamptz default (now() + interval '3 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.items enable row level security;

create policy "Items are viewable by everyone"
  on public.items for select using (true);

create policy "Authenticated users can create items"
  on public.items for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own items"
  on public.items for update using (auth.uid() = seller_id);

create policy "Sellers can delete their own items"
  on public.items for delete using (auth.uid() = seller_id);

-- ============================================
-- 3. BIDS TABLE
-- ============================================
create table if not exists public.bids (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  bidder_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table public.bids enable row level security;

create policy "Bids are viewable by everyone"
  on public.bids for select using (true);

create policy "Authenticated users can place bids"
  on public.bids for insert with check (auth.uid() = bidder_id);

-- Trigger: update item current_bid and active_bidders on new bid
create or replace function public.handle_new_bid()
returns trigger as $$
begin
  update public.items
  set
    current_bid = new.amount,
    active_bidders = (
      select count(distinct bidder_id) from public.bids where item_id = new.item_id
    ),
    updated_at = now()
  where id = new.item_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_bid_placed on public.bids;
create trigger on_bid_placed
  after insert on public.bids
  for each row execute function public.handle_new_bid();

-- ============================================
-- 4. CONVERSATIONS TABLE
-- ============================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message text default '',
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============================================
-- 5. MESSAGES TABLE
-- ============================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  text text default '',
  type text default 'text' check (type in ('text', 'bid', 'alert')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Trigger: update conversation last_message on new message
create or replace function public.handle_new_message()
returns trigger as $$
begin
  update public.conversations
  set last_message = new.text,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_sent on public.messages;
create trigger on_message_sent
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete set null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  final_price numeric(10,2) not null,
  platform_fee numeric(10,2) default 0,
  status text default 'pending' check (status in ('pending', 'delivered', 'rated')),
  rating int check (rating >= 0 and rating <= 5),
  review_comment text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated users can create orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================
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

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Trigger: notify seller when a new bid is placed
create or replace function public.notify_on_bid()
returns trigger as $$
begin
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

-- Trigger: notify recipient when a new message is sent
create or replace function public.notify_on_message()
returns trigger as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  -- Find the recipient (the other person in the conversation)
  select case
    when c.buyer_id = NEW.sender_id then c.seller_id
    else c.buyer_id
  end into recipient_id
  from public.conversations c where c.id = NEW.conversation_id;

  -- Get sender name
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

-- ============================================
-- 8. FAVORITES TABLE
-- ============================================
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select using (auth.uid() = user_id);

create policy "Users can favorite items"
  on public.favorites for insert with check (auth.uid() = user_id);

create policy "Users can unfavorite items"
  on public.favorites for delete using (auth.uid() = user_id);

-- ============================================
-- 9. REPORTS TABLE
-- ============================================
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id),
  reported_item_id uuid references public.items(id),
  reason text not null,
  details text default '',
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
  on public.reports for select using (auth.uid() = reporter_id);

-- ============================================
-- Extend profiles for Phase 2
-- ============================================
-- Add new columns if they don't exist (safe to re-run)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'trust_score') then
    alter table public.profiles add column trust_score int default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'badges') then
    alter table public.profiles add column badges text[] default '{}';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'school_name') then
    alter table public.profiles add column school_name text default '';
  end if;
end $$;

-- ============================================
-- Extend items for Phase 2 (fixed price / buy now)
-- ============================================
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'listing_type') then
    alter table public.items add column listing_type text default 'auction' check (listing_type in ('auction', 'fixed', 'both'));
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'buy_now_price') then
    alter table public.items add column buy_now_price numeric(10,2);
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'allow_offers') then
    alter table public.items add column allow_offers boolean default false;
  end if;
end $$;

-- ============================================
-- Enable Realtime for key tables
-- ============================================
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.favorites;
