-- Supabase SQL schema for Inventory Management for Shop MVP
-- Run this file in the Supabase SQL editor before using the backend API routes.

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'staff');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_transaction_type') then
    create type public.stock_transaction_type as enum ('in', 'out');
  end if;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  name text not null,
  role public.app_role not null default 'staff',
  password_hash text not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_username_not_blank check (length(trim(username)) > 0),
  constraint app_users_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  stock integer not null default 0 check (stock >= 0),
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items
  add column if not exists created_by uuid references public.app_users(id) on delete set null,
  add column if not exists updated_by uuid references public.app_users(id) on delete set null;

create table if not exists public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  item_name text not null,
  type public.stock_transaction_type not null,
  quantity integer not null check (quantity > 0),
  stock_before integer not null check (stock_before >= 0),
  stock_after integer not null check (stock_after >= 0),
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.stock_transactions
  add column if not exists created_by uuid references public.app_users(id) on delete set null;

create index if not exists app_users_username_idx on public.app_users(lower(username));
create index if not exists app_users_role_idx on public.app_users(role);
create index if not exists inventory_items_name_idx on public.inventory_items(name);
create index if not exists stock_transactions_item_id_idx on public.stock_transactions(item_id);
create index if not exists stock_transactions_type_idx on public.stock_transactions(type);
create index if not exists stock_transactions_created_at_idx on public.stock_transactions(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

create or replace function public.authenticate_app_user(
  p_username text,
  p_password text
)
returns table (
  id uuid,
  username text,
  name text,
  role public.app_role,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.app_users u
  set last_login_at = now()
  where lower(u.username) = lower(trim(p_username))
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
    and u.is_active = true;

  return query
  select u.id, u.username, u.name, u.role, u.is_active, u.created_at, u.updated_at
  from public.app_users u
  where lower(u.username) = lower(trim(p_username))
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
    and u.is_active = true
  limit 1;
end;
$$;

create or replace function public.create_app_user(
  p_username text,
  p_password text,
  p_name text,
  p_role text default 'staff'
)
returns public.app_users
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users%rowtype;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'Username is required' using errcode = '22023';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters' using errcode = '22023';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Name is required' using errcode = '22023';
  end if;

  if p_role not in ('admin', 'staff') then
    raise exception 'Role must be admin or staff' using errcode = '22023';
  end if;

  insert into public.app_users (username, name, role, password_hash)
  values (lower(trim(p_username)), trim(p_name), p_role::public.app_role, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning * into v_user;

  return v_user;
end;
$$;

create or replace function public.update_app_user_password(
  p_user_id uuid,
  p_password text
)
returns public.app_users
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.app_users%rowtype;
begin
  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters' using errcode = '22023';
  end if;

  update public.app_users
  set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  where id = p_user_id
  returning * into v_user;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  return v_user;
end;
$$;

create or replace function public.record_stock_transaction(
  p_item_id uuid,
  p_type text,
  p_quantity integer,
  p_notes text default null,
  p_user_id uuid default null
)
returns public.stock_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.inventory_items%rowtype;
  v_stock_after integer;
  v_transaction public.stock_transactions%rowtype;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero' using errcode = '22023';
  end if;

  if p_type not in ('in', 'out') then
    raise exception 'Type must be either in or out' using errcode = '22023';
  end if;

  select * into v_item
  from public.inventory_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found' using errcode = 'P0002';
  end if;

  if p_type = 'out' and v_item.stock < p_quantity then
    raise exception 'Insufficient stock' using errcode = '22023';
  end if;

  if p_type = 'in' then
    v_stock_after := v_item.stock + p_quantity;
  else
    v_stock_after := v_item.stock - p_quantity;
  end if;

  update public.inventory_items
  set stock = v_stock_after,
      updated_by = p_user_id
  where id = p_item_id;

  insert into public.stock_transactions (
    item_id,
    item_name,
    type,
    quantity,
    stock_before,
    stock_after,
    notes,
    created_by
  ) values (
    v_item.id,
    v_item.name,
    p_type::public.stock_transaction_type,
    p_quantity,
    v_item.stock,
    v_stock_after,
    p_notes,
    p_user_id
  ) returning * into v_transaction;

  return v_transaction;
end;
$$;

insert into public.app_users (username, name, role, password_hash)
values
  ('admin', 'Administrator', 'admin', extensions.crypt('admin123', extensions.gen_salt('bf'))),
  ('staff', 'Staff', 'staff', extensions.crypt('staff123', extensions.gen_salt('bf')))
on conflict (username) do nothing;

alter table public.app_users enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_transactions enable row level security;
