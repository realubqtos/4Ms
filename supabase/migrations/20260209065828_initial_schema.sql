/*
  # 4Ms Initial Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `full_name` (text, nullable)
      - `theme_preference` (text, default 'night')
      - `primary_domain` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `projects`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, references profiles, not null)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `primary_domain` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `figures`
      - `id` (uuid, primary key, auto-generated)
      - `project_id` (uuid, references projects, not null)
      - `user_id` (uuid, references profiles, not null)
      - `type` (text, not null)
      - `prompt` (text, not null)
      - `domain` (text, not null)
      - `file_url` (text, nullable)
      - `thumbnail_url` (text, nullable)
      - `parameters` (jsonb, default '{}')
      - `iteration_count` (integer, default 0)
      - `is_favorite` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `generations`
      - `id` (uuid, primary key, auto-generated)
      - `figure_id` (uuid, references figures, not null)
      - `iteration` (integer, not null)
      - `prompt` (text, not null)
      - `parameters` (jsonb, default '{}')
      - `file_url` (text, nullable)
      - `feedback` (text, nullable)
      - `created_at` (timestamptz, default now())

    - `collections`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, references profiles, not null)
      - `name` (text, not null)
      - `description` (text, nullable)
      - `domain` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `collection_figures`
      - `collection_id` (uuid, references collections)
      - `figure_id` (uuid, references figures)
      - `created_at` (timestamptz, default now())
      - Primary key on (collection_id, figure_id)

    - `tags`
      - `id` (uuid, primary key, auto-generated)
      - `name` (text, unique, not null)
      - `domain` (text, nullable)
      - `created_at` (timestamptz, default now())

    - `figure_tags`
      - `figure_id` (uuid, references figures)
      - `tag_id` (uuid, references tags)
      - `created_at` (timestamptz, default now())
      - Primary key on (figure_id, tag_id)

    - `conversations`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, references profiles, not null)
      - `figure_id` (uuid, references figures, nullable)
      - `messages` (jsonb, default '[]')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Restrict access based on user_id ownership
    - Allow users to read their own profiles, projects, figures, etc.
    - Allow users to create, update, and delete their own resources

  3. Indexes
    - Add indexes on foreign keys for query performance
    - Add indexes on frequently filtered columns (user_id, domain, created_at)

  4. Storage Buckets
    - Create 'figures' bucket for generated figure files
    - Create 'data-files' bucket for uploaded data files (CSV, JSON)
    - Enable RLS on storage buckets with user-specific policies
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  theme_preference text DEFAULT 'night' NOT NULL,
  primary_domain text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  primary_domain text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON projects(primary_domain);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE TABLE IF NOT EXISTS figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  prompt text NOT NULL,
  domain text NOT NULL,
  file_url text,
  thumbnail_url text,
  parameters jsonb DEFAULT '{}' NOT NULL,
  iteration_count integer DEFAULT 0 NOT NULL,
  is_favorite boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own figures"
  ON figures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own figures"
  ON figures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own figures"
  ON figures FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own figures"
  ON figures FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_figures_user_id ON figures(user_id);
CREATE INDEX IF NOT EXISTS idx_figures_project_id ON figures(project_id);
CREATE INDEX IF NOT EXISTS idx_figures_domain ON figures(domain);
CREATE INDEX IF NOT EXISTS idx_figures_type ON figures(type);
CREATE INDEX IF NOT EXISTS idx_figures_created_at ON figures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_figures_is_favorite ON figures(is_favorite) WHERE is_favorite = true;

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id uuid REFERENCES figures(id) ON DELETE CASCADE NOT NULL,
  iteration integer NOT NULL,
  prompt text NOT NULL,
  parameters jsonb DEFAULT '{}' NOT NULL,
  file_url text,
  feedback text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view generations of own figures"
  ON generations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = generations.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create generations for own figures"
  ON generations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = generations.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_generations_figure_id ON generations(figure_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at DESC);

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  domain text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
  ON collections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

CREATE TABLE IF NOT EXISTS collection_figures (
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  figure_id uuid REFERENCES figures(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (collection_id, figure_id)
);

ALTER TABLE collection_figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view figures in own collections"
  ON collection_figures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_figures.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add figures to own collections"
  ON collection_figures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_figures.collection_id
      AND collections.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = collection_figures.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove figures from own collections"
  ON collection_figures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_figures.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  domain text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS figure_tags (
  figure_id uuid REFERENCES figures(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (figure_id, tag_id)
);

ALTER TABLE figure_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags on own figures"
  ON figure_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = figure_tags.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to own figures"
  ON figure_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = figure_tags.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own figures"
  ON figure_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM figures
      WHERE figures.id = figure_tags.figure_id
      AND figures.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  figure_id uuid REFERENCES figures(id) ON DELETE SET NULL,
  messages jsonb DEFAULT '[]' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_figure_id ON conversations(figure_id);

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('figures', 'figures', false),
  ('data-files', 'data-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own figure files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'figures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own figure files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'figures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own figure files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'figures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'figures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own figure files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'figures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own data files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'data-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own data files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'data-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own data files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'data-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
