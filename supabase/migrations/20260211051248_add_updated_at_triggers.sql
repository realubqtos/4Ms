/*
  # Add automatic updated_at triggers

  1. New Functions
    - `handle_updated_at()` - Trigger function that sets `updated_at = now()` on every UPDATE

  2. New Triggers
    - Applied to all 5 tables with `updated_at` columns:
      - `profiles`
      - `projects`
      - `figures`
      - `collections`
      - `conversations`

  3. Notes
    - Uses CREATE OR REPLACE to be idempotent
    - Each trigger fires BEFORE UPDATE so the timestamp is set before the row is written
*/

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['profiles', 'projects', 'figures', 'collections', 'conversations'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = tbl::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION handle_updated_at()',
        tbl
      );
    END IF;
  END LOOP;
END $$;
