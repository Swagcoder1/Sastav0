/*
  # Add Friends, Messages, and Notifications System

  1. New Tables
    - `friendships` - Manages friend relationships between users
      - `id` (uuid, primary key)
      - `requester_id` (uuid) - User who sent the friend request
      - `addressee_id` (uuid) - User who received the friend request
      - `status` (text) - pending, accepted, declined, blocked
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages` - Direct messages between users
      - `id` (uuid, primary key)
      - `sender_id` (uuid) - User who sent the message
      - `receiver_id` (uuid) - User who received the message
      - `content` (text) - Message content
      - `read` (boolean) - Whether message has been read
      - `created_at` (timestamptz)

    - `notifications` - System notifications for users
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User receiving the notification
      - `type` (text) - friend_request, message, new_user_match, etc.
      - `title` (text) - Notification title
      - `content` (text) - Notification content
      - `data` (jsonb) - Additional data (user_id, message_id, etc.)
      - `read` (boolean) - Whether notification has been read
      - `created_at` (timestamptz)

    - `game_participants` - Track users signed up for games
      - `id` (uuid, primary key)
      - `game_id` (uuid) - Reference to game
      - `user_id` (uuid) - User participating
      - `status` (text) - joined, left, pending
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Users can only see their own friendships, messages, and notifications

  3. Functions
    - Function to create notifications
    - Function to check friendship status
    - Function to get mutual friends
*/

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'message', 'new_user_match', 'game_update')),
  title text NOT NULL,
  content text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL, -- This would reference a games table when implemented
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'pending')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can create friend requests"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own friendships"
  ON friendships
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Game participants policies
CREATE POLICY "Users can view game participants"
  ON game_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join games"
  ON game_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS friendships_requester_id_idx ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_id_idx ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS friendships_status_idx ON friendships(status);

CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_content text,
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, content, data)
  VALUES (p_user_id, p_type, p_title, p_content, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check friendship status
CREATE OR REPLACE FUNCTION get_friendship_status(user1_id uuid, user2_id uuid)
RETURNS text AS $$
DECLARE
  friendship_status text;
BEGIN
  SELECT status INTO friendship_status
  FROM friendships
  WHERE (requester_id = user1_id AND addressee_id = user2_id)
     OR (requester_id = user2_id AND addressee_id = user1_id);
  
  RETURN COALESCE(friendship_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
DECLARE
  mutual_count integer;
BEGIN
  SELECT COUNT(*) INTO mutual_count
  FROM (
    SELECT CASE 
      WHEN f1.requester_id = user1_id THEN f1.addressee_id 
      ELSE f1.requester_id 
    END AS friend_id
    FROM friendships f1
    WHERE (f1.requester_id = user1_id OR f1.addressee_id = user1_id)
      AND f1.status = 'accepted'
  ) user1_friends
  INNER JOIN (
    SELECT CASE 
      WHEN f2.requester_id = user2_id THEN f2.addressee_id 
      ELSE f2.requester_id 
    END AS friend_id
    FROM friendships f2
    WHERE (f2.requester_id = user2_id OR f2.addressee_id = user2_id)
      AND f2.status = 'accepted'
  ) user2_friends ON user1_friends.friend_id = user2_friends.friend_id;
  
  RETURN mutual_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications when friend requests are made
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM create_notification(
      NEW.addressee_id,
      'friend_request',
      'Nova zahtev za prijateljstvo',
      (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.requester_id) || ' želi da vam bude prijatelj.',
      jsonb_build_object('requester_id', NEW.requester_id, 'friendship_id', NEW.id)
    );
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'friend_accepted',
      'Zahtev za prijateljstvo prihvaćen',
      (SELECT first_name || ' ' || last_name FROM profiles WHERE id = NEW.addressee_id) || ' je prihvatio/la vaš zahtev za prijateljstvo.',
      jsonb_build_object('friend_id', NEW.addressee_id, 'friendship_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER friendship_notification_trigger
  AFTER INSERT OR UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- Trigger to create notifications when messages are sent
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  friendship_status text;
  sender_name text;
BEGIN
  -- Get sender name
  SELECT first_name || ' ' || last_name INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;
  
  -- Check if users are friends
  SELECT get_friendship_status(NEW.sender_id, NEW.receiver_id) INTO friendship_status;
  
  IF friendship_status = 'accepted' THEN
    -- Friends - regular message notification
    PERFORM create_notification(
      NEW.receiver_id,
      'message',
      'Nova poruka od ' || sender_name,
      LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
      jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id, 'is_friend', true)
    );
  ELSE
    -- Not friends - message request notification
    PERFORM create_notification(
      NEW.receiver_id,
      'message',
      'Zahtev za poruku od ' || sender_name,
      sender_name || ' vam je poslao/la poruku. Prihvatite zahtev za prijateljstvo da biste odgovorili.',
      jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id, 'is_friend', false)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Function to find users with similar interests for new user notifications
CREATE OR REPLACE FUNCTION notify_similar_users_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  similar_user RECORD;
BEGIN
  -- Find users with similar skills or positions
  FOR similar_user IN
    SELECT DISTINCT p.id, p.first_name, p.last_name
    FROM profiles p
    WHERE p.id != NEW.id
      AND (
        p.skills && NEW.skills OR  -- Has overlapping skills
        p.positions && NEW.positions  -- Has overlapping positions
      )
      AND p.created_at > (now() - interval '30 days')  -- Active users
    LIMIT 10
  LOOP
    PERFORM create_notification(
      similar_user.id,
      'new_user_match',
      'Novi korisnik sa sličnim interesovanjima',
      NEW.first_name || ' ' || NEW.last_name || ' se pridružio/la Sastavu sa sličnim veštinama kao vi!',
      jsonb_build_object('new_user_id', NEW.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER new_user_notification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_similar_users_on_signup();