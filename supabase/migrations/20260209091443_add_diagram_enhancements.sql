/*
  # Add Diagram Generation Enhancements
  
  This migration extends the existing schema to support AI-powered diagram generation with PaperBanana.
  
  ## Changes
  
  ### 1. Extend `figures` table
  Add columns to support A2UI rendering and status tracking:
  - `diagram_data` (jsonb) - A2UI JSON payload for canvas rendering
  - `status` (text) - Generation status (pending, generating, completed, failed)
  
  ### 2. Extend `generations` table
  Add agent feedback column for iterative refinement:
  - `agent_feedback` (text) - Critic agent's evaluation
  - `changes_made` (text) - Description of refinements
  - `diagram_data` (jsonb) - A2UI data for this version
  
  ### 3. Create `diagram_references` table
  Reference diagrams for PaperBanana Retriever agent:
  - `id` (uuid, primary key) - Reference identifier
  - `type` (text) - Diagram type
  - `domain` (text) - Scientific domain
  - `reference_url` (text) - URL to reference image
  - `description` (text) - Description of reference
  - `metadata` (jsonb) - Additional reference data
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 4. Create `conversation_messages` table
  Individual messages for better querying than JSONB array:
  - `id` (uuid, primary key) - Message identifier
  - `conversation_id` (uuid, foreign key) - Parent conversation
  - `role` (text) - Message role (user, assistant, system)
  - `content` (text) - Message content
  - `figure_id` (uuid, foreign key) - Referenced figure
  - `metadata` (jsonb) - Additional message data
  - `created_at` (timestamptz) - Message timestamp
  
  ## Security
  
  - Enable RLS on new tables
  - Users can only access their own conversation messages
  - diagram_references is publicly readable for Retriever agent
  - Admins can manage diagram references
*/

-- Add new columns to figures table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'figures' AND column_name = 'diagram_data'
  ) THEN
    ALTER TABLE figures ADD COLUMN diagram_data jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'figures' AND column_name = 'status'
  ) THEN
    ALTER TABLE figures ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add new columns to generations table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'agent_feedback'
  ) THEN
    ALTER TABLE generations ADD COLUMN agent_feedback text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'changes_made'
  ) THEN
    ALTER TABLE generations ADD COLUMN changes_made text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generations' AND column_name = 'diagram_data'
  ) THEN
    ALTER TABLE generations ADD COLUMN diagram_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create diagram_references table
CREATE TABLE IF NOT EXISTS diagram_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  domain text NOT NULL,
  reference_url text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diagram_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view diagram references"
  ON diagram_references FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert diagram references"
  ON diagram_references FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update diagram references"
  ON diagram_references FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete diagram references"
  ON diagram_references FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  figure_id uuid REFERENCES figures(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation messages"
  ON conversation_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversation messages"
  ON conversation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own conversation messages"
  ON conversation_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagram_references_type_domain ON diagram_references(type, domain);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_figure_id ON conversation_messages(figure_id) WHERE figure_id IS NOT NULL;