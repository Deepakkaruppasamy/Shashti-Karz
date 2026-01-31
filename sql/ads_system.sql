-- Create the ads table
create table if not exists public.ads (
    id uuid not null default gen_random_uuid(),
    title text not null,
    description text,
    media_url text, -- URL to video or image
    media_type text check (media_type in ('video', 'image')),
    thumbnail_url text, -- For video poster
    target_url text, -- Where the ad links to
    position text not null, -- 'home_hero', 'sidebar', 'popup', etc.
    status text not null default 'draft' check (status in ('active', 'draft', 'scheduled', 'archived')),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    priority integer default 0,
    impressions integer default 0,
    clicks integer default 0,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint ads_pkey primary key (id)
);

-- Enable RLS
alter table public.ads enable row level security;

-- Policies for ads table
create policy "Public can view active ads" 
    on public.ads for select 
    using (status = 'active' and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now()));

create policy "Admins can manage all ads" 
    on public.ads for all 
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Log ad interactions (optional separate table for detailed analytics, but we'll stick to counters in ads table for simplicity first)
-- Create storage bucket for ad assets if it doesn't exist
insert into storage.buckets (id, name, public)
values ('ad-assets', 'ad-assets', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'ad-assets' );

create policy "Admin Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'ad-assets' and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admin Update"
  on storage.objects for update
  using (
    bucket_id = 'ad-assets' and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admin Delete"
  on storage.objects for delete
  using (
    bucket_id = 'ad-assets' and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
