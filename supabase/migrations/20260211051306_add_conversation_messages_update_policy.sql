/*
  # Add missing UPDATE policy for conversation_messages

  1. Security
    - Add UPDATE policy so users can update messages in their own conversations
    - Joins to `conversations` table to verify ownership via `user_id`
*/

CREATE POLICY "Users can update own conversation messages"
  ON conversation_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
