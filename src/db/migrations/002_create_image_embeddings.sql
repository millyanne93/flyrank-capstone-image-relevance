CREATE TABLE image_embeddings (
    image_id UUID PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
    embedding REAL[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_image_embeddings_image_id ON image_embeddings(image_id);
