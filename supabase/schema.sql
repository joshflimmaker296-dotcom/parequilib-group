-- Parequilib Group — production schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'buyer' check (role in ('buyer','admin')),
  stripe_account_id text,
  stripe_onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- LISTINGS ----------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  category text not null default 'Other',
  image_url text,
  ai_generated boolean not null default false,
  status text not null default 'active' check (status in ('active','sold','removed')),
  created_at timestamptz not null default now()
);

-- ---------- MESSAGES ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- OFFERS ----------
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now()
);

-- ---------- ORDERS (real payments) ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  stripe_session_id text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  created_at timestamptz not null default now()
);

-- ================= ROW LEVEL SECURITY =================
alter table profiles enable row level security;
alter table listings enable row level security;
alter table messages enable row level security;
alter table offers enable row level security;
alter table orders enable row level security;

-- Profiles: anyone signed in can read public profile fields; only the owner can update their own row
create policy "profiles are readable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Listings: active listings are readable by anyone signed in; only the seller can insert/update/delete their own
create policy "active listings readable" on listings
  for select using (status = 'active' or seller_id = auth.uid());
create policy "sellers can insert their own listings" on listings
  for insert with check (seller_id = auth.uid());
create policy "sellers can update their own listings" on listings
  for update using (seller_id = auth.uid());
create policy "sellers can delete their own listings" on listings
  for delete using (seller_id = auth.uid());

-- Messages: only the buyer who wrote it or the listing's seller can read/write a thread
create policy "thread participants can read messages" on messages
  for select using (
    sender_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid())
    or exists (
      select 1 from messages m2
      where m2.listing_id = messages.listing_id and m2.sender_id = auth.uid()
    )
  );
create policy "authenticated users can send messages" on messages
  for insert with check (sender_id = auth.uid());

-- Offers: buyer or seller of the listing can see offers; only the buyer can create one
create policy "offer participants can read" on offers
  for select using (
    buyer_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid())
  );
create policy "buyers can make offers" on offers
  for insert with check (buyer_id = auth.uid());
create policy "sellers can update offer status" on offers
  for update using (exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- Orders: buyer, seller, or admin can read; only server (service role) writes orders
create policy "order participants can read" on orders
  for select using (
    buyer_id = auth.uid()
    or seller_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ================= ADMIN ACCESS =================
-- Admins can read everything regardless of the policies above.
create policy "admins read all listings" on listings for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins read all messages" on messages for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "admins read all offers" on offers for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- To make your first admin account, run this after you've signed up once:
--   update profiles set role = 'admin' where email = 'you@example.com';

-- ================= STORAGE (listing photos) =================
-- Run once: creates a public bucket for listing images and a policy
-- letting any authenticated user upload to their own folder.
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "public read of listing images" on storage.objects
  for select using (bucket_id = 'listing-images');
create policy "authenticated users can upload listing images" on storage.objects
  for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
