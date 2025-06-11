/*
  # Fix profiles table and add fields for search functionality

  1. New Columns Added to Profiles
    - first_name (text) - User's first name
    - last_name (text) - User's last name  
    - skills (text[]) - Array of user skills
    - positions (text[]) - Array of playing positions

  2. New Tables
    - fields table for football field/venue information
      - id (uuid, primary key)
      - name (text) - Field name
      - address (text) - Field address
      - city (text) - City location
      - rating (numeric) - Field rating
      - price_range (text) - Price information
      - features (text[]) - Array of field features
      - coordinates (jsonb) - GPS coordinates
      - created_at (timestamptz) - Creation timestamp

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated user access
    - Users can read all profiles and fields
    - Users can only update their own profile

  4. Search Functionality
    - Full-text search indexes on profile names and usernames
    - Full-text search indexes on field names and addresses
    - City-based filtering for fields

  5. Sample Data
    - Pre-populated fields table with Serbian football venues
*/

-- Add missing columns to profiles table if they don't exist
DO $$
BEGIN
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

  -- Add positions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'positions' AND column_name = 'positions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN positions text[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop all existing policies for profiles
  DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Public profiles are readable" ON profiles;
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  
  -- Create comprehensive policies for profiles
  CREATE POLICY "Public profiles are readable"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
END $$;

-- Create search indexes for profiles (only after columns exist)
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles USING gin(to_tsvector('english', username));
CREATE INDEX IF NOT EXISTS profiles_first_name_idx ON profiles USING gin(to_tsvector('english', COALESCE(first_name, '')));
CREATE INDEX IF NOT EXISTS profiles_last_name_idx ON profiles USING gin(to_tsvector('english', COALESCE(last_name, '')));
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON profiles USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));

-- Create fields table for location/field search
CREATE TABLE IF NOT EXISTS fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Beograd',
  rating numeric(2,1) DEFAULT 0.0,
  price_range text,
  features text[] DEFAULT '{}',
  coordinates jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on fields
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Drop and recreate fields policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Fields are viewable by authenticated users" ON fields;
  
  CREATE POLICY "Fields are viewable by authenticated users"
    ON fields
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Create search indexes for fields
CREATE INDEX IF NOT EXISTS fields_name_idx ON fields USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS fields_address_idx ON fields USING gin(to_tsvector('english', address));
CREATE INDEX IF NOT EXISTS fields_city_idx ON fields (city);

-- Insert sample fields data (only if table is empty)
INSERT INTO fields (name, address, city, rating, price_range, features)
SELECT * FROM (VALUES
  ('Sportski centar "Crvena zvezda"', 'Ljutice Bogdana 1a', 'Beograd', 4.8, '800-1200 RSD/sat', ARRAY['Parking', 'Svlačionice', 'Tuš', 'Kafić']),
  ('Arena "Beograd"', 'Bulevar Mihajla Pupina 165', 'Novi Beograd', 4.6, '1000-1500 RSD/sat', ARRAY['Parking', 'Restoran', 'Prodavnica', 'Večernje osvetljenje']),
  ('Fudbalski klub "Partizan"', 'Humska 1', 'Beograd', 4.9, '1200-1800 RSD/sat', ARRAY['Premium', 'Trenerska analiza', 'Video snimanje', 'Fizioterapija']),
  ('Sportski centar "Novi Sad"', 'Bulevar oslobođenja 46', 'Novi Sad', 4.5, '600-1000 RSD/sat', ARRAY['Parking', 'Svlačionice', 'Kafić']),
  ('Arena "Niš"', 'Čarnojevićeva 2', 'Niš', 4.3, '500-800 RSD/sat', ARRAY['Parking', 'Svlačionice', 'Večernje osvetljenje'])
) AS v(name, address, city, rating, price_range, features)
WHERE NOT EXISTS (SELECT 1 FROM fields LIMIT 1);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();