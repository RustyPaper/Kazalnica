-- ============================================
-- POLLS SYSTEM - Database Schema
-- ============================================

-- Tabela ankiet
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT FALSE,
  allow_multiple_votes BOOLEAN DEFAULT FALSE
);

-- Tabela opcji do głosowania
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela głosów
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  
  -- Informacje o głosującym
  voter_name VARCHAR(255),
  voter_phone VARCHAR(50),
  
  -- Lokale (array JSON)
  apartments JSONB NOT NULL, -- [{ number: "D.3.21", shareAmount: "76" }, ...]
  
  -- Suma udziałów
  total_shares DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  ip_address VARCHAR(50),
  user_agent TEXT,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unikalność: jeden głos na lokal w danej ankiecie
  UNIQUE(poll_id, apartments)
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_closes_at ON polls(closes_at);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);

-- Funkcja automatycznego zamykania ankiet
CREATE OR REPLACE FUNCTION close_expired_polls()
RETURNS void AS $$
BEGIN
  UPDATE polls
  SET is_closed = TRUE
  WHERE closes_at IS NOT NULL
    AND closes_at <= NOW()
    AND is_closed = FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE polls IS 'Ankiety utworzone przez adminów';
COMMENT ON TABLE poll_options IS 'Opcje do wyboru w ankiecie';
COMMENT ON TABLE poll_votes IS 'Głosy oddane w ankietach z wieloma lokalami';
