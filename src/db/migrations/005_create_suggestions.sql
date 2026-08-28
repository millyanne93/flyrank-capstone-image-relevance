CREATE TYPE guard_decision AS ENUM ('accepted', 'rejected', 'no_match');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    similarity_score REAL,
    guard_decision guard_decision NOT NULL,
    guard_reason TEXT NOT NULL,
    review_status review_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestions_post_id ON suggestions(post_id);
CREATE INDEX idx_suggestions_review_status ON suggestions(review_status);
