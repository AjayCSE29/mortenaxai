-- Store the most recently observed client IP address for each user.
-- Idempotent migration for existing PostgreSQL databases.
-- Fresh databases are handled automatically by Base.metadata.create_all on startup.

ALTER TABLE users ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
