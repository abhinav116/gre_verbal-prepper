-- Articles table
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  url text not null unique,
  excerpt text not null,
  topic text not null check (topic in ('Science', 'Humanities', 'Social Science', 'Business')),
  difficulty integer not null check (difficulty between 1 and 5),
  reading_time integer not null, -- in minutes
  gre_vocab jsonb not null default '[]', -- [{word, definition, sentence}]
  questions jsonb not null default '[]', -- [{question, options: [A,B,C,D], answer}]
  score integer not null default 0, -- curation score out of 25
  published_at timestamptz,
  sent_at timestamptz,
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- Subscribers table
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmation_token uuid not null default gen_random_uuid(),
  active boolean not null default false,
  subscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for daily send job (find unsent articles)
create index if not exists articles_sent_idx on articles (sent, created_at);

-- Index for active subscribers
create index if not exists subscribers_active_idx on subscribers (active);

-- Index for confirmation token lookup
create index if not exists subscribers_token_idx on subscribers (confirmation_token);
