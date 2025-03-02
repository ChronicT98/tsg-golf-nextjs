-- Create YouTube videos table for storing embedded YouTube video data
CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  caption TEXT,
  youtube_id VARCHAR(100) NOT NULL,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Create an update_updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at field automatically
DROP TRIGGER IF EXISTS youtube_videos_updated_at ON youtube_videos;
CREATE TRIGGER youtube_videos_updated_at
BEFORE UPDATE ON youtube_videos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create an index on youtube_id for faster lookups
CREATE INDEX IF NOT EXISTS youtube_videos_youtube_id_idx ON youtube_videos(youtube_id);

-- Create an index on active status for filtering
CREATE INDEX IF NOT EXISTS youtube_videos_active_idx ON youtube_videos(active);

-- Create an index on created_at for ordered listing
CREATE INDEX IF NOT EXISTS youtube_videos_created_at_idx ON youtube_videos(created_at DESC);

-- Create an index on order_index for manual ordering
CREATE INDEX IF NOT EXISTS youtube_videos_order_idx ON youtube_videos(order_index);

-- Add comment to describe table purpose
COMMENT ON TABLE youtube_videos IS 'Stores YouTube video information for embedding videos on the website';

-- Create RLS policies
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Simple policies without checking specific user roles
-- Allow anyone to view videos
DROP POLICY IF EXISTS youtube_videos_select_policy ON youtube_videos;
CREATE POLICY youtube_videos_select_policy ON youtube_videos
  FOR SELECT
  USING (true);

-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS youtube_videos_all_policy ON youtube_videos;
CREATE POLICY youtube_videos_all_policy ON youtube_videos
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add RLS (Row Level Security) policies for general use
-- Allow anonymous users to read videos
CREATE POLICY "Anyone can view videos" 
  ON youtube_videos 
  FOR SELECT 
  USING (true);

-- Only authenticated users can insert, update, or delete videos
CREATE POLICY "Authenticated users can insert videos" 
  ON youtube_videos 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update videos" 
  ON youtube_videos 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete videos" 
  ON youtube_videos 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Add sample data (uncomment and modify as needed)
/*
INSERT INTO youtube_videos (youtube_id, title, caption)
VALUES 
  ('dQw4w9WgXcQ', 'Sample YouTube Video 1', 'This is a sample video'),
  ('ZZ5LpwO-An4', 'Sample YouTube Video 2', 'This is another sample video');
*/