-- Login verification (2FA): idempotent migration for existing PostgreSQL databases.
-- Fresh databases are handled automatically by Base.metadata.create_all on startup.

CREATE TABLE IF NOT EXISTS login_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR NOT NULL,
    otp_hash VARCHAR NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_login_verifications_user_id ON login_verifications (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_login_verifications_challenge_id ON login_verifications (challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_login_verifications_active_user ON login_verifications (user_id) WHERE used_at IS NULL;
