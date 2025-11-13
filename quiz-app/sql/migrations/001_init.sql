-- Init schema for quiz-app
CREATE TABLE IF NOT EXISTS attempts (
  id SERIAL PRIMARY KEY,
  bank TEXT,
  user_email TEXT,
  score INTEGER,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ranking (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  bank TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ranking_score ON ranking(score DESC);
