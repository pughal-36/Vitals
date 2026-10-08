-- Additive migration for scans table (status and pipeline fields)
-- Safe to run multiple times (idempotent)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS status text DEFAULT 'done';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS quick_checks jsonb DEFAULT NULL;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS summary text DEFAULT NULL;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS error_text text DEFAULT NULL;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS timings jsonb DEFAULT NULL;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for 24h cache lookups by url + strategy
CREATE INDEX IF NOT EXISTS idx_scans_url_strategy_created ON scans (url, strategy, created_at DESC);
