/*
  # Fix User Profiles and Data Storage

  1. Schema Updates
    - Ensure all profile columns exist with proper defaults
    - Fix any missing constraints and indexes
    - Add proper foreign key relationships

  2. Profile Creation
    - Ensure profiles are created properly on signup
    - Add trigger to auto-create profile from auth.users
    - Handle missing profile data gracefully

  3. Data Integrity
    - Add proper validation and constraints
    - Ensure all user data is captured during registration
    - Fix any data type issues

  4. Statistics and Game Data
    - Add user statistics tracking
    - Add game history and performance data
    - Add proper relationships for game participation
*/

-- First, ensure the profiles table has all required columns with proper defaults
DO $$
BEGIN
  -- Add username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name text;
  END IF;

  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;

  -- Add bio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text DEFAULT 'Beograd';
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  -- Add skills column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills text[] DEFAULT '{}';
  END IF;

  -- Add positions column if it doesn't exist (fix typo from previous migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'positions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN positions text[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure the profiles table has proper constraints
DO $$
BEGIN
  -- Make username unique if constraint doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_username_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;

  -- Add foreign key to auth.users if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create user statistics table for tracking game performance
CREATE TABLE IF NOT EXISTS user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport text NOT NULL CHECK (sport IN ('football', 'padel', 'basketball')),
  games_played integer DEFAULT 0,
  games_won integer DEFAULT 0,
  games_lost integer DEFAULT 0,
  goals_scored integer DEFAULT 0,
  assists integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0.0,
  total_rating_points integer DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport)
);

-- Create game history table for tracking individual game performances
CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL, -- Reference to actual game when implemented
  sport text NOT NULL CHECK (sport IN ('football', 'padel', 'basketball')),
  result text CHECK (result IN ('win', 'loss', 'draw')),
  goals_scored integer DEFAULT 0,
  assists integer DEFAULT 0,
  rating numeric(2,1),
  notes text,
  played_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  sport text CHECK (sport IN ('football', 'padel', 'basketball')),
  unlocked_at timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'
);

-- Enable RLS on new tables
ALTER TABLE user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Add policies for user statistics
CREATE POLICY "Users can view all statistics"
  ON user_statistics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own statistics"
  ON user_statistics
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add policies for game history
CREATE POLICY "Users can view all game history"
  ON game_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own game history"
  ON game_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add policies for achievements
CREATE POLICY "Users can view all achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own achievements"
  ON user_achievements
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_statistics_user_id_idx ON user_statistics(user_id);
CREATE INDEX IF NOT EXISTS user_statistics_sport_idx ON user_statistics(sport);
CREATE INDEX IF NOT EXISTS game_history_user_id_idx ON game_history(user_id);
CREATE INDEX IF NOT EXISTS game_history_played_at_idx ON game_history(played_at DESC);
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user statistics when profile is created
CREATE OR REPLACE FUNCTION create_default_user_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default statistics for all sports
  INSERT INTO user_statistics (user_id, sport)
  VALUES 
    (NEW.id, 'football'),
    (NEW.id, 'padel'),
    (NEW.id, 'basketball')
  ON CONFLICT (user_id, sport) DO NOTHING;
  
  -- Create welcome achievement
  INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
  VALUES (NEW.id, 'welcome', 'Novi igrač', 'Dobrodošli u Sastav!')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create statistics when profile is created
DROP TRIGGER IF EXISTS create_user_statistics_trigger ON profiles;
CREATE TRIGGER create_user_statistics_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_statistics();

-- Function to handle new user signup from auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO profiles (
    id,
    username,
    email,
    first_name,
    last_name,
    full_name,
    skills,
    positions,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
      NEW.email
    ),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')),
      '{}'::text[]
    ),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'positions')),
      '{}'::text[]
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    skills = EXCLUDED.skills,
    positions = EXCLUDED.positions,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update user statistics after a game
CREATE OR REPLACE FUNCTION update_user_statistics_after_game()
RETURNS TRIGGER AS $$
BEGIN
  -- Update statistics based on game result
  UPDATE user_statistics
  SET 
    games_played = games_played + 1,
    games_won = games_won + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
    games_lost = games_lost + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
    goals_scored = goals_scored + COALESCE(NEW.goals_scored, 0),
    assists = assists + COALESCE(NEW.assists, 0),
    total_rating_points = total_rating_points + COALESCE(NEW.rating::integer, 0),
    rating_count = rating_count + CASE WHEN NEW.rating IS NOT NULL THEN 1 ELSE 0 END,
    average_rating = CASE 
      WHEN rating_count + CASE WHEN NEW.rating IS NOT NULL THEN 1 ELSE 0 END > 0 
      THEN (total_rating_points + COALESCE(NEW.rating::integer, 0))::numeric / (rating_count + CASE WHEN NEW.rating IS NOT NULL THEN 1 ELSE 0 END)
      ELSE 0 
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND sport = NEW.sport;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update statistics when game history is added
CREATE TRIGGER update_statistics_after_game
  AFTER INSERT ON game_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_statistics_after_game();

-- Function to get user statistics for a specific sport
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id uuid, p_sport text)
RETURNS TABLE (
  games_played integer,
  games_won integer,
  games_lost integer,
  goals_scored integer,
  assists integer,
  average_rating numeric,
  win_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.games_played,
    us.games_won,
    us.games_lost,
    us.goals_scored,
    us.assists,
    us.average_rating,
    CASE 
      WHEN us.games_played > 0 
      THEN ROUND((us.games_won::numeric / us.games_played::numeric) * 100, 1)
      ELSE 0 
    END as win_percentage
  FROM user_statistics us
  WHERE us.user_id = p_user_id AND us.sport = p_sport;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION get_user_achievements(p_user_id uuid, p_sport text DEFAULT NULL)
RETURNS TABLE (
  achievement_name text,
  achievement_description text,
  sport text,
  unlocked_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.achievement_name,
    ua.achievement_description,
    ua.sport,
    ua.unlocked_at
  FROM user_achievements ua
  WHERE ua.user_id = p_user_id
    AND (p_sport IS NULL OR ua.sport = p_sport OR ua.sport IS NULL)
  ORDER BY ua.unlocked_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample achievements for existing users (if any)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    -- Create default statistics if they don't exist
    INSERT INTO user_statistics (user_id, sport)
    VALUES 
      (user_record.id, 'football'),
      (user_record.id, 'padel'),
      (user_record.id, 'basketball')
    ON CONFLICT (user_id, sport) DO NOTHING;
    
    -- Create welcome achievement if it doesn't exist
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description)
    VALUES (user_record.id, 'welcome', 'Novi igrač', 'Dobrodošli u Sastav!')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;