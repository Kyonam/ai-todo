-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create priority enum type
create type public.priority as enum ('high', 'medium', 'low');

-- Create profiles table (public.users)
-- Links 1:1 with auth.users
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create todos table
create table if not exists public.todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority public.priority default 'medium'::public.priority,
  category text[] default array[]::text[],
  due_date timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.todos enable row level security;

-- Policies for public.users
-- Users can view their own profile
create policy "Users can view own profile"
  on public.users for select
  using ( auth.uid() = id );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using ( auth.uid() = id );

-- Policies for public.todos
-- Users can view their own todos
create policy "Users can view own todos"
  on public.todos for select
  using ( auth.uid() = user_id );

-- Users can create their own todos
create policy "Users can create own todos"
  on public.todos for insert
  with check ( auth.uid() = user_id );

-- Users can update their own todos
create policy "Users can update own todos"
  on public.todos for update
  using ( auth.uid() = user_id );

-- Users can delete their own todos
create policy "Users can delete own todos"
  on public.todos for delete
  using ( auth.uid() = user_id );

-- Function to handle new user signup (Trigger)
-- Automatically creates a profile in public.users when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
