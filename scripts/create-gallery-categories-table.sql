-- Create a new table for gallery categories ordering
CREATE TABLE IF NOT EXISTS gallery_categories (
  id SERIAL PRIMARY KEY,
  category_id TEXT NOT NULL UNIQUE,
  original_name TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an index for faster lookup by order
CREATE INDEX IF NOT EXISTS gallery_categories_order_index_idx ON gallery_categories (order_index);

-- Add a comment to the table
COMMENT ON TABLE gallery_categories IS 'Stores gallery categories and their display order';

-- Add comments to the fields
COMMENT ON COLUMN gallery_categories.category_id IS 'The ID of the category (folder name in storage)';
COMMENT ON COLUMN gallery_categories.original_name IS 'The original display name of the category';
COMMENT ON COLUMN gallery_categories.order_index IS 'The display order of the category (lower numbers come first)';