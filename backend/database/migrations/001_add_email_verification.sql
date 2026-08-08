-- Email verification: idempotent migration for existing PostgreSQL databases.
-- Fresh databases are handled automatically by Base.metadata.create_all on startup.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_email_verifications_user_id ON email_verifications (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_verifications_active_user ON email_verifications (user_id) WHERE used_at IS NULL;
