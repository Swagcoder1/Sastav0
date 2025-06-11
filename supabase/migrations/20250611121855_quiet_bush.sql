/*
  # Fix User Profiles and Rating System

  1. Schema Updates
    - Add questionnaire data columns to profiles
    - Update user statistics with rating system
    - Add game simulation and rating updates

  2. Rating System
    - Win: +0.4 rating points
    - Loss: -0.4 rating points
    - Rating range: 2.0 to 3.5

  3. Achievement System
    - Dynamic achievements based on performance
    - Sport-specific achievements

  4. Functions
    - Rating calculation functions
    - Achievement unlock functions
    - Game result processing
*/

-- Add questionnaire data columns to profiles
DO $$
BEGIN
  -- Add questionnaire columns for each sport
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'football_questionnaire'
  ) THEN
    ALTER TABLE profiles ADD COLUMN football_questionnaire jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'padel_questionnaire'
  ) THEN
    ALTER TABLE profiles ADD COLUMN padel_questionnaire jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'basketball_questionnaire'
  ) THEN
    ALTER TABLE profiles ADD COLUMN basketball_questionnaire jsonb DEFAULT '{}';
  END IF;

  -- Add initial rating columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'football_initial_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN football_initial_rating numeric(2,1) DEFAULT 2.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'padel_initial_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN padel_initial_rating numeric(2,1) DEFAULT 2.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'basketball_initial_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN basketball_initial_rating numeric(2,1) DEFAULT 2.0;
  END IF;
END $$;

-- Function to simulate a game result and update ratings
CREATE OR REPLACE FUNCTION simulate_game_result(
  p_user_id uuid,
  p_sport text,
  p_result text, -- 'win' or 'loss'
  p_goals_scored integer DEFAULT 0,
  p_assists integer DEFAULT 0
)
RETURNS void AS $$
DECLARE
  current_rating numeric(2,1);
  new_rating numeric(2,1);
  rating_change numeric(2,1);
BEGIN
  -- Get current rating
  SELECT average_rating INTO current_rating
  FROM user_statistics
  WHERE user_id = p_user_id AND sport = p_sport;

  -- If no stats exist, use initial rating from profile
  IF current_rating IS NULL THEN
    CASE p_sport
      WHEN 'football' THEN
        SELECT COALESCE(football_initial_rating, 2.0) INTO current_rating
        FROM profiles WHERE id = p_user_id;
      WHEN 'padel' THEN
        SELECT COALESCE(padel_initial_rating, 2.0) INTO current_rating
        FROM profiles WHERE id = p_user_id;
      WHEN 'basketball' THEN
        SELECT COALESCE(basketball_initial_rating, 2.0) INTO current_rating
        FROM profiles WHERE id = p_user_id;
      ELSE
        current_rating := 2.0;
    END CASE;
  END IF;

  -- Calculate rating change
  IF p_result = 'win' THEN
    rating_change := 0.4;
  ELSE
    rating_change := -0.4;
  END IF;

  -- Calculate new rating (clamped between 2.0 and 3.5)
  new_rating := GREATEST(2.0, LEAST(3.5, current_rating + rating_change));

  -- Add game to history
  INSERT INTO game_history (
    user_id,
    game_id,
    sport,
    result,
    goals_scored,
    assists,
    rating,
    played_at
  ) VALUES (
    p_user_id,
    gen_random_uuid(), -- Mock game ID
    p_sport,
    p_result,
    p_goals_scored,
    p_assists,
    new_rating,
    now()
  );

  -- Update user statistics will be handled by the trigger
  
  -- Check for new achievements
  PERFORM check_and_unlock_achievements(p_user_id, p_sport);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_user_id uuid,
  p_sport text
)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
  achievement_exists boolean;
BEGIN
  -- Get current stats
  SELECT * INTO stats_record
  FROM user_statistics
  WHERE user_id = p_user_id AND sport = p_sport;

  IF stats_record IS NULL THEN
    RETURN;
  END IF;

  -- First Game Achievement
  IF stats_record.games_played = 1 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'first_game'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'first_game', 'Prvi meč', 'Odigrali ste svoj prvi meč!', p_sport
      );
    END IF;
  END IF;

  -- 5 Games Achievement
  IF stats_record.games_played = 5 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'five_games'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'five_games', 'Redovan igrač', 'Odigrali ste 5 mečeva!', p_sport
      );
    END IF;
  END IF;

  -- 10 Games Achievement
  IF stats_record.games_played = 10 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'ten_games'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'ten_games', 'Veteran', 'Odigrali ste 10 mečeva!', p_sport
      );
    END IF;
  END IF;

  -- First Win Achievement
  IF stats_record.games_won = 1 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'first_win'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'first_win', 'Prva pobeda', 'Osvojili ste svoj prvi meč!', p_sport
      );
    END IF;
  END IF;

  -- High Rating Achievement (3.0+)
  IF stats_record.average_rating >= 3.0 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'high_rating'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'high_rating', 'Visoka ocena', 'Dostigli ste ocenu od 3.0!', p_sport
      );
    END IF;
  END IF;

  -- Goal Scorer Achievement (Football only)
  IF p_sport = 'football' AND stats_record.goals_scored >= 5 THEN
    SELECT EXISTS(
      SELECT 1 FROM user_achievements
      WHERE user_id = p_user_id 
      AND achievement_type = 'goal_scorer'
      AND sport = p_sport
    ) INTO achievement_exists;

    IF NOT achievement_exists THEN
      INSERT INTO user_achievements (
        user_id, achievement_type, achievement_name, achievement_description, sport
      ) VALUES (
        p_user_id, 'goal_scorer', 'Strelac', 'Postigli ste 5 golova!', p_sport
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a mock game result for testing
CREATE OR REPLACE FUNCTION add_mock_game_result(
  p_user_id uuid,
  p_sport text DEFAULT 'football'
)
RETURNS text AS $$
DECLARE
  result_type text;
  goals integer;
  assists integer;
BEGIN
  -- Randomly determine win/loss (60% win rate for testing)
  IF random() < 0.6 THEN
    result_type := 'win';
    goals := floor(random() * 3) + 1; -- 1-3 goals for wins
  ELSE
    result_type := 'loss';
    goals := floor(random() * 2); -- 0-1 goals for losses
  END IF;

  assists := floor(random() * 2); -- 0-1 assists

  -- Simulate the game
  PERFORM simulate_game_result(p_user_id, p_sport, result_type, goals, assists);

  RETURN 'Added ' || result_type || ' with ' || goals || ' goals and ' || assists || ' assists';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing user statistics update function to use initial ratings
CREATE OR REPLACE FUNCTION update_user_statistics_after_game()
RETURNS TRIGGER AS $$
DECLARE
  initial_rating numeric(2,1);
BEGIN
  -- Get initial rating if this is the first game
  IF NOT EXISTS (
    SELECT 1 FROM user_statistics 
    WHERE user_id = NEW.user_id AND sport = NEW.sport
  ) THEN
    -- Get initial rating from profile
    CASE NEW.sport
      WHEN 'football' THEN
        SELECT COALESCE(football_initial_rating, 2.0) INTO initial_rating
        FROM profiles WHERE id = NEW.user_id;
      WHEN 'padel' THEN
        SELECT COALESCE(padel_initial_rating, 2.0) INTO initial_rating
        FROM profiles WHERE id = NEW.user_id;
      WHEN 'basketball' THEN
        SELECT COALESCE(basketball_initial_rating, 2.0) INTO initial_rating
        FROM profiles WHERE id = NEW.user_id;
      ELSE
        initial_rating := 2.0;
    END CASE;

    -- Create initial statistics record
    INSERT INTO user_statistics (
      user_id, sport, average_rating, games_played, games_won, games_lost,
      goals_scored, assists, total_rating_points, rating_count
    ) VALUES (
      NEW.user_id, NEW.sport, initial_rating, 0, 0, 0, 0, 0, 0, 0
    );
  END IF;

  -- Update statistics based on game result
  UPDATE user_statistics
  SET 
    games_played = games_played + 1,
    games_won = games_won + CASE WHEN NEW.result = 'win' THEN 1 ELSE 0 END,
    games_lost = games_lost + CASE WHEN NEW.result = 'loss' THEN 1 ELSE 0 END,
    goals_scored = goals_scored + COALESCE(NEW.goals_scored, 0),
    assists = assists + COALESCE(NEW.assists, 0),
    average_rating = COALESCE(NEW.rating, average_rating),
    updated_at = NOW()
  WHERE user_id = NEW.user_id AND sport = NEW.sport;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user rank in leaderboard
CREATE OR REPLACE FUNCTION get_user_rank_in_leaderboard(
  p_user_id uuid,
  p_sport text
)
RETURNS integer AS $$
DECLARE
  user_rank integer;
BEGIN
  SELECT rank_position INTO user_rank
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY average_rating DESC, games_won DESC) as rank_position
    FROM user_statistics
    WHERE sport = p_sport AND games_played > 0
  ) ranked_users
  WHERE user_id = p_user_id;

  RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create some sample achievements for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    -- Ensure user has statistics for all sports
    INSERT INTO user_statistics (user_id, sport, average_rating)
    VALUES 
      (user_record.id, 'football', 2.0),
      (user_record.id, 'padel', 2.0),
      (user_record.id, 'basketball', 2.0)
    ON CONFLICT (user_id, sport) DO NOTHING;
    
    -- Add welcome achievement if it doesn't exist
    INSERT INTO user_achievements (
      user_id, achievement_type, achievement_name, achievement_description
    ) VALUES (
      user_record.id, 'welcome', 'Novi igrač', 'Dobrodošli u Sastav!'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;