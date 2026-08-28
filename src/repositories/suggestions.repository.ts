import { query, queryOne } from '../db/client';

export interface Suggestion {
    id: string;
    post_id: string;
    image_id?: string;
    similarity_score?: number;
    guard_decision: 'accepted' | 'rejected' | 'no_match';
    guard_reason: string;
    review_status: 'pending' | 'approved' | 'rejected';
    created_at: Date;
}

export async function createSuggestion(
    postId: string,
    imageId: string | null,
    similarityScore: number | null,
    guardDecision: 'accepted' | 'rejected' | 'no_match',
    guardReason: string
): Promise<Suggestion> {
    const rows = await query<Suggestion>(
        `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_decision, guard_reason)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [postId, imageId, similarityScore, guardDecision, guardReason]
    );
    return rows[0];
}

export async function getSuggestionById(id: string): Promise<Suggestion | null> {
    return await queryOne<Suggestion>(
        'SELECT * FROM suggestions WHERE id = $1',
        [id]
    );
}

export async function getPendingSuggestions(): Promise<Suggestion[]> {
    return await query<Suggestion>(
        `SELECT s.*, p.title as post_title, i.filename as image_filename
         FROM suggestions s
         LEFT JOIN posts p ON s.post_id = p.id
         LEFT JOIN images i ON s.image_id = i.id
         WHERE s.review_status = 'pending'
         ORDER BY s.created_at ASC`
    );
}

export async function approveSuggestion(id: string): Promise<Suggestion | null> {
    return await queryOne<Suggestion>(
        `UPDATE suggestions
         SET review_status = 'approved'
         WHERE id = $1
         RETURNING *`,
        [id]
    );
}

export async function rejectSuggestion(id: string): Promise<Suggestion | null> {
    return await queryOne<Suggestion>(
        `UPDATE suggestions
         SET review_status = 'rejected'
         WHERE id = $1
         RETURNING *`,
        [id]
    );
}
