CREATE TABLE post_embeddings (
    post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    embedding REAL[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_embeddings_post_id ON post_embeddings(post_id);
