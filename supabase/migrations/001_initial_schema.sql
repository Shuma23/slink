create extension if not exists "pgcrypto";

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  original_url text not null,
  slug text not null,
  path_type text not null default 's' check (path_type in ('s', 't', 'p')),
  title text,
  description text,
  og_image_url text,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_slug_format check (slug ~ '^[A-Za-z0-9_-]+$'),
  constraint links_url_protocol check (original_url ~* '^https?://')
);

create unique index if not exists links_path_slug_key on public.links (path_type, slug);
create index if not exists links_user_created_idx on public.links (user_id, created_at desc);
create index if not exists links_user_archived_idx on public.links (user_id, is_archived);

create table if not exists public.link_destinations (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  destination_url text not null,
  weight integer not null default 1 check (weight >= 1),
  is_active boolean not null default true,
  clicks_count integer not null default 0 check (clicks_count >= 0),
  created_at timestamptz not null default now(),
  constraint link_destinations_url_protocol check (destination_url ~* '^https?://')
);

create index if not exists link_destinations_link_idx on public.link_destinations (link_id);

create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  destination_id uuid references public.link_destinations(id) on delete set null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  ip_hash text,
  country text,
  device_type text,
  browser text,
  os text
);

create index if not exists click_events_link_clicked_idx on public.click_events (link_id, clicked_at desc);
create index if not exists click_events_clicked_idx on public.click_events (clicked_at desc);

create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  constraint labels_color_format check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index if not exists labels_user_name_key on public.labels (user_id, lower(name));

create table if not exists public.link_labels (
  link_id uuid not null references public.links(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (link_id, label_id)
);

create index if not exists link_labels_label_idx on public.link_labels (label_id);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  slug text not null unique,
  title text not null,
  bio text,
  theme jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_pages_slug_format check (slug ~ '^[A-Za-z0-9_-]+$')
);

create index if not exists landing_pages_user_created_idx on public.landing_pages (user_id, created_at desc);

create table if not exists public.landing_page_items (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  type text not null check (type in ('link', 'sns', 'product', 'image')),
  title text not null,
  url text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint landing_page_items_url_protocol check (url is null or url ~* '^https?://')
);

create index if not exists landing_page_items_page_sort_idx on public.landing_page_items (landing_page_id, sort_order);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_links_updated_at on public.links;
create trigger touch_links_updated_at
before update on public.links
for each row execute function public.touch_updated_at();

drop trigger if exists touch_landing_pages_updated_at on public.landing_pages;
create trigger touch_landing_pages_updated_at
before update on public.landing_pages
for each row execute function public.touch_updated_at();

create or replace function public.increment_destination_clicks(destination_uuid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.link_destinations
  set clicks_count = clicks_count + 1
  where id = destination_uuid;
$$;

alter table public.links enable row level security;
alter table public.link_destinations enable row level security;
alter table public.click_events enable row level security;
alter table public.labels enable row level security;
alter table public.link_labels enable row level security;
alter table public.landing_pages enable row level security;
alter table public.landing_page_items enable row level security;

create policy "Users can select own links"
on public.links for select
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can insert own links"
on public.links for insert
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can update own links"
on public.links for update
using (user_id = auth.jwt() ->> 'sub')
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can delete own links"
on public.links for delete
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can select own destinations"
on public.link_destinations for select
using (
  exists (
    select 1 from public.links
    where links.id = link_destinations.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can insert own destinations"
on public.link_destinations for insert
with check (
  exists (
    select 1 from public.links
    where links.id = link_destinations.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can update own destinations"
on public.link_destinations for update
using (
  exists (
    select 1 from public.links
    where links.id = link_destinations.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
)
with check (
  exists (
    select 1 from public.links
    where links.id = link_destinations.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can delete own destinations"
on public.link_destinations for delete
using (
  exists (
    select 1 from public.links
    where links.id = link_destinations.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can select own click events"
on public.click_events for select
using (
  exists (
    select 1 from public.links
    where links.id = click_events.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can select own labels"
on public.labels for select
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can insert own labels"
on public.labels for insert
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can update own labels"
on public.labels for update
using (user_id = auth.jwt() ->> 'sub')
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can delete own labels"
on public.labels for delete
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can select own link labels"
on public.link_labels for select
using (
  exists (
    select 1 from public.links
    where links.id = link_labels.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can insert own link labels"
on public.link_labels for insert
with check (
  exists (
    select 1 from public.links
    where links.id = link_labels.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
  and exists (
    select 1 from public.labels
    where labels.id = link_labels.label_id
    and labels.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can delete own link labels"
on public.link_labels for delete
using (
  exists (
    select 1 from public.links
    where links.id = link_labels.link_id
    and links.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can select own landing pages"
on public.landing_pages for select
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can insert own landing pages"
on public.landing_pages for insert
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can update own landing pages"
on public.landing_pages for update
using (user_id = auth.jwt() ->> 'sub')
with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can delete own landing pages"
on public.landing_pages for delete
using (user_id = auth.jwt() ->> 'sub');

create policy "Users can select own landing page items"
on public.landing_page_items for select
using (
  exists (
    select 1 from public.landing_pages
    where landing_pages.id = landing_page_items.landing_page_id
    and landing_pages.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can insert own landing page items"
on public.landing_page_items for insert
with check (
  exists (
    select 1 from public.landing_pages
    where landing_pages.id = landing_page_items.landing_page_id
    and landing_pages.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can update own landing page items"
on public.landing_page_items for update
using (
  exists (
    select 1 from public.landing_pages
    where landing_pages.id = landing_page_items.landing_page_id
    and landing_pages.user_id = auth.jwt() ->> 'sub'
  )
)
with check (
  exists (
    select 1 from public.landing_pages
    where landing_pages.id = landing_page_items.landing_page_id
    and landing_pages.user_id = auth.jwt() ->> 'sub'
  )
);

create policy "Users can delete own landing page items"
on public.landing_page_items for delete
using (
  exists (
    select 1 from public.landing_pages
    where landing_pages.id = landing_page_items.landing_page_id
    and landing_pages.user_id = auth.jwt() ->> 'sub'
  )
);
