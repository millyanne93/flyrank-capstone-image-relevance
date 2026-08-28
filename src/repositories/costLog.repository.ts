import { query } from '../db/client';

export interface CostLog {
    id: string;
    call_type: 'vision' | 'embedding';
    reference_id: string;
    estimated_cost_usd: number;
    created_at: Date;
}

export async function insertCostLog(
    callType: 'vision' | 'embedding',
    referenceId: string,
    estimatedCostUsd: number
): Promise<void> {
    await query(
        `INSERT INTO cost_log (call_type, reference_id, estimated_cost_usd)
         VALUES ($1, $2, $3)`,
        [callType, referenceId, estimatedCostUsd]
    );
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
