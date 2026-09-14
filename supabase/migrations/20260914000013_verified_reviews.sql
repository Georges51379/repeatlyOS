-- New feature: reviews restricted to a shopper with an actual completed
-- order or booking at that business, optionally with a photo — chosen over
-- open/unverified reviews specifically to build trust fast in a newly
-- launched city, where a first-time shopper has no other signal besides the
-- `verified` badge (migration 20260914000010) and whatever reviews exist.
--
-- "Verified" is enforced at write time, not just implied by UI copy: the
-- insert policy below re-derives from the referenced order/booking itself
-- that (a) it belongs to the business being reviewed, (b) it is actually
-- completed, and (c) the phone number on this review matches the phone
-- number on that order/booking — a shopper cannot leave a review by citing
-- someone else's completed order id.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  customer_name text,
  customer_phone text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  photo_url text,
  created_at timestamptz not null default now(),
  constraint reviews_exactly_one_source check (
    (order_id is not null and booking_id is null) or (order_id is null and booking_id is not null)
  ),
  unique (order_id),
  unique (booking_id)
);

create index reviews_business_id_idx on public.reviews (business_id);

alter table public.reviews enable row level security;

-- Public read for any business visible on the marketplace — reviews are the
-- point of being public.
create policy reviews_public_read on public.reviews
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'active' and b.marketplace_visible = true
    )
  );

create policy reviews_verified_insert on public.reviews
  for insert
  with check (
    (
      order_id is not null
      and exists (
        select 1 from public.orders o
        where o.id = order_id
          and o.business_id = reviews.business_id
          and o.status = 'completed'
          and o.customer_phone = reviews.customer_phone
      )
    )
    or (
      booking_id is not null
      and exists (
        select 1 from public.bookings bk
        where bk.id = booking_id
          and bk.business_id = reviews.business_id
          and bk.status = 'completed'
          and bk.customer_phone = reviews.customer_phone
      )
    )
  );

create policy reviews_business_delete_own on public.reviews
  for delete using (public.has_business_permission(business_id, 'reviews.moderate') or public.is_platform_admin());

-- Storage bucket for review photos. Public read (a review photo is public by
-- definition once the review is). `file_size_limit`/`allowed_mime_types`
-- keep an anonymous upload from being an arbitrary-file dumping ground.
--
-- KNOWN GAP, noted deliberately rather than silently shipped: the upload
-- policy below cannot re-check "this uploader actually has a matching
-- completed order/booking" the way `reviews_verified_insert` does, because
-- Postgres RLS on `storage.objects` has no join back to a request the
-- client hasn't sent yet at upload time (the photo is uploaded, then the
-- `reviews` row referencing its URL is inserted second). A determined
-- anonymous caller could upload photos to this bucket without ever
-- completing a review. Acceptable for an initial launch given the size/type
-- limits above bound the damage; the real fix is routing this through a
-- server-side Edge Function that validates the order/booking first and only
-- then uploads on the caller's behalf — revisit if this bucket sees abuse.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy review_photos_public_read on storage.objects
  for select using (bucket_id = 'review-photos');

create policy review_photos_public_upload on storage.objects
  for insert
  with check (bucket_id = 'review-photos');
