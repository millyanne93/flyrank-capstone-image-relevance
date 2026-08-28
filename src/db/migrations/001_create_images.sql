CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL UNIQUE,
    filepath TEXT NOT NULL,
    subject TEXT,
    category TEXT,
    attributes JSONB,
    caption TEXT,
    confidence REAL,
    processing_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'tagged', 'flagged', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_processing_status ON images(processing_status);
CREATE INDEX idx_images_filename ON images(filename);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at 
    BEFORE UPDATE ON images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
