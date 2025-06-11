/*
  # Add User Presence and Game Chat System

  1. New Tables
    - `user_presence` - Track user online/offline status
      - `user_id` (uuid, primary key) - References profiles
      - `status` (text) - online, offline, away
      - `last_seen` (timestamptz) - Last activity timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `game_chats` - Group chats for games
      - `id` (uuid, primary key)
      - `game_id` (uuid) - Reference to game
      - `name` (text) - Chat name
      - `description` (text) - Chat description
      - `created_by` (uuid) - User who created the chat
      - `created_at` (timestamptz) - Creation timestamp

    - `game_messages` - Messages in game chats
      - `id` (uuid, primary key)
      - `game_chat_id` (uuid) - References game_chats
      - `sender_id` (uuid) - References profiles
      - `content` (text) - Message content
      - `message_type` (text) - text, system, join, leave
      - `read` (boolean) - Whether message has been read
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Users can only update their own presence
    - Users can view game chats they participate in

  3. Functions
    - Function to update presence automatically
    - Function to clean up old presence data
*/

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_chats table
CREATE TABLE IF NOT EXISTS game_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL, -- This references a games table when implemented
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create game_messages table
CREATE TABLE IF NOT EXISTS game_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_chat_id uuid NOT NULL REFERENCES game_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'join', 'leave')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_messages ENABLE ROW LEVEL SECURITY;

-- User presence policies
CREATE POLICY "Users can view all presence data"
  ON user_presence
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence data"
  ON user_presence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Game chats policies
CREATE POLICY "Users can view game chats they participate in"
  ON game_chats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_participants gp 
      WHERE gp.game_id = game_chats.game_id 
      AND gp.user_id = auth.uid() 
      AND gp.status = 'joined'
    )
  );

CREATE POLICY "Users can create game chats"
  ON game_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Game messages policies
CREATE POLICY "Users can view messages in their game chats"
  ON game_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_chats gc
      JOIN game_participants gp ON gc.game_id = gp.game_id
      WHERE gc.id = game_messages.game_chat_id
      AND gp.user_id = auth.uid()
      AND gp.status = 'joined'
    )
  );

CREATE POLICY "Users can send messages to their game chats"
  ON game_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM game_chats gc
      JOIN game_participants gp ON gc.game_id = gp.game_id
      WHERE gc.id = game_messages.game_chat_id
      AND gp.user_id = auth.uid()
      AND gp.status = 'joined'
    )
  );

CREATE POLICY "Users can update read status of messages"
  ON game_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_chats gc
      JOIN game_participants gp ON gc.game_id = gp.game_id
      WHERE gc.id = game_messages.game_chat_id
      AND gp.user_id = auth.uid()
      AND gp.status = 'joined'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_presence_status_idx ON user_presence(status);
CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx ON user_presence(last_seen);

CREATE INDEX IF NOT EXISTS game_chats_game_id_idx ON game_chats(game_id);
CREATE INDEX IF NOT EXISTS game_chats_created_by_idx ON game_chats(created_by);

CREATE INDEX IF NOT EXISTS game_messages_game_chat_id_idx ON game_messages(game_chat_id);
CREATE INDEX IF NOT EXISTS game_messages_sender_id_idx ON game_messages(sender_id);
CREATE INDEX IF NOT EXISTS game_messages_created_at_idx ON game_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS game_messages_read_idx ON game_messages(read);

-- Create trigger for updating user_presence updated_at
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old presence data (users offline for more than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET status = 'offline'
  WHERE status != 'offline' 
  AND last_seen < (now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get online friends for a user
CREATE OR REPLACE FUNCTION get_online_friends(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  status text,
  last_seen timestamptz,
  username text,
  first_name text,
  last_name text,
  avatar_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.status,
    up.last_seen,
    p.username,
    p.first_name,
    p.last_name,
    p.avatar_url
  FROM user_presence up
  JOIN profiles p ON up.user_id = p.id
  WHERE up.user_id IN (
    SELECT CASE 
      WHEN f.requester_id = p_user_id THEN f.addressee_id 
      ELSE f.requester_id 
    END
    FROM friendships f
    WHERE (f.requester_id = p_user_id OR f.addressee_id = p_user_id)
    AND f.status = 'accepted'
  )
  AND up.status = 'online'
  AND up.last_seen > (now() - interval '5 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample game chats for testing (only if game_participants table has data)
DO $$
BEGIN
  -- Only insert if we have game participants
  IF EXISTS (SELECT 1 FROM game_participants LIMIT 1) THEN
    INSERT INTO game_chats (game_id, name, description, created_by)
    SELECT DISTINCT 
      gp.game_id,
      'Game Chat #' || gp.game_id,
      'Group chat for game participants',
      gp.user_id
    FROM game_participants gp
    WHERE NOT EXISTS (
      SELECT 1 FROM game_chats gc WHERE gc.game_id = gp.game_id
    )
    LIMIT 5;
  END IF;
END $$;