import { query } from '../db/client';
import { evaluateMatch, MatchCandidate } from './mismatchGuard.service';
import { config } from '../config';

export async function findBestMatch(
    postId: string,
    postTitle: string,
    postCategory: string
): Promise<{
    accepted: boolean;
    image_id?: string;
    reason?: string;
    similarity_score?: number;
    candidate?: any;
}> {
    const postEmbedding = await query<{ embedding: number[] }>(
        'SELECT embedding FROM post_embeddings WHERE post_id = $1',
        [postId]
    );

    if (postEmbedding.length === 0) {
        return { accepted: false, reason: 'Post embedding not found' };
    }

    const images = await query<{
        id: string;
        subject: string;
        category: string;
        caption: string;
        confidence: number;
        embedding: number[];
    }>(
        `SELECT i.id, i.subject, i.category, i.caption, i.confidence, ie.embedding
         FROM images i
         JOIN image_embeddings ie ON i.id = ie.image_id
         WHERE i.processing_status = 'tagged'`
    );

    if (images.length === 0) {
        return { accepted: false, reason: 'No tagged images available' };
    }

    const postVector = postEmbedding[0].embedding;
    const candidates: MatchCandidate[] = images.map(img => ({
        image_id: img.id,
        subject: img.subject || 'unknown',
        category: img.category || 'unknown',
        caption: img.caption || '',
        confidence: img.confidence || 0,
        similarity_score: cosineSimilarity(postVector, img.embedding),
    }));

    candidates.sort((a, b) => b.similarity_score - a.similarity_score);

    if (candidates.length === 0) {
        return { accepted: false, reason: 'No candidates found' };
    }

    const topCandidate = candidates[0];
    const guardResult = evaluateMatch(
        postCategory,
        postTitle,
        topCandidate,
        config.thresholds.similarity
    );

    return {
        accepted: guardResult.accepted,
        image_id: guardResult.image_id,
        reason: guardResult.reason,
        similarity_score: guardResult.similarity_score,
        candidate: topCandidate,
    };
}

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
