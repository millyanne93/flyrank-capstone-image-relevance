CREATE TYPE call_type AS ENUM ('vision', 'embedding');

CREATE TABLE cost_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_type call_type NOT NULL,
    reference_id UUID NOT NULL,
    estimated_cost_usd NUMERIC(10, 8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_log_call_type_created_at ON cost_log(call_type, created_at);
CREATE INDEX idx_cost_log_reference_id ON cost_log(reference_id);
