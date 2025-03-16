-- Create officials table
CREATE TABLE officials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role1 TEXT NOT NULL,
  role2 TEXT,
  order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add initial sample data
INSERT INTO officials (name, role1, role2, order) VALUES
  ('Christian Kafka', 'Präsident', 'Auswertung', 1),
  ('Ernst Aigner', 'Kassier', NULL, 2),
  ('Peter Konrad', 'Kassaprüfer', 'Turnierkarten', 3),
  ('Tobias Kafka', 'Homepage', NULL, 4),
  ('Bernhard Anderle', 'Medien', 'Marketing', 5);