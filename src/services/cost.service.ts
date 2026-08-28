import { config } from '../config';
import { query } from '../db/client';


const VISION_COST_PER_1M_INPUT_TOKENS = 0.15;  
const VISION_COST_PER_1M_OUTPUT_TOKENS = 0.60; 
const EMBEDDING_COST_PER_1M_TOKENS = 0.13;  

export function estimateVisionCost(inputTokens: number = 200, outputTokens: number = 100): number {
    const inputCost = (inputTokens / 1_000_000) * VISION_COST_PER_1M_INPUT_TOKENS;
    const outputCost = (outputTokens / 1_000_000) * VISION_COST_PER_1M_OUTPUT_TOKENS;
    return inputCost + outputCost;
}

export function estimateEmbeddingCost(tokens: number = 200): number {
    return (tokens / 1_000_000) * EMBEDDING_COST_PER_1M_TOKENS;
}

export async function logCost(
    callType: 'vision' | 'embedding',
    referenceId: string,
    estimatedCostUsd: number
): Promise<void> {
    await query(
        `INSERT INTO cost_log (call_type, reference_id, estimated_cost_usd)
         VALUES ($1, $2, $3)`,
        [callType, referenceId, estimatedCostUsd]
    );
    console.log(` Logged ${callType} cost: $${estimatedCostUsd.toFixed(8)} for ${referenceId}`);
}

export async function getTotalCost(): Promise<number> {
    const rows = await query<{ total: string }>(
        'SELECT SUM(estimated_cost_usd) as total FROM cost_log'
    );
    return parseFloat(rows[0]?.total || '0');
}

export async function getCostBreakdown(): Promise<{
    vision: number;
    embedding: number;
    total: number;
}> {
    const rows = await query<{ call_type: string; total: string }>(
        'SELECT call_type, SUM(estimated_cost_usd) as total FROM cost_log GROUP BY call_type'
    );

    let vision = 0;
    let embedding = 0;

    for (const row of rows) {
        if (row.call_type === 'vision') vision = parseFloat(row.total);
        if (row.call_type === 'embedding') embedding = parseFloat(row.total);
    }

    return {
        vision,
        embedding,
        total: vision + embedding,
    };
}
