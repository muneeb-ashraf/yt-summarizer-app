-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  email text unique,
  subscription text default 'free' not null,
  stripe_customer_id text,
  provider text,
  provider_user_id text,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

create policy "Users can view their own profile"
  on users for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on users for update
  using ( auth.uid() = id );

-- Create summaries table
create table public.summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade not null,
  video_id text not null,
  video_title text not null,
  video_duration integer not null,
  summary text not null,
  format text not null,
  language text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for summaries
alter table public.summaries enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own summaries" on summaries;
drop policy if exists "Users can insert their own summaries" on summaries;
drop policy if exists "Users can create their own summaries" on summaries;

-- Create comprehensive policies for summaries
create policy "Users can view their own summaries"
  on summaries for select
  using ( auth.uid() = user_id );

create policy "Users can create their own summaries"
  on summaries for insert
  with check ( auth.uid() = user_id );

-- Create functions to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Set up trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();