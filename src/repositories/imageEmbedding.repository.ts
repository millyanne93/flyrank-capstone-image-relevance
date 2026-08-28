import { query } from '../db/client';

export async function saveImageEmbedding(
    imageId: string,
    embedding: number[]
): Promise<void> {
    await query(
        `INSERT INTO image_embeddings (image_id, embedding)
         VALUES ($1, $2)
         ON CONFLICT (image_id) DO UPDATE SET embedding = $2, created_at = NOW()`,
        [imageId, embedding]
    );
}

export async function getImageEmbedding(imageId: string): Promise<number[] | null> {
    const rows = await query<{ embedding: number[] }>(
        'SELECT embedding FROM image_embeddings WHERE image_id = $1',
        [imageId]
    );
    return rows[0]?.embedding || null;
}

export async function getAllImageEmbeddings(): Promise<{
    image_id: string;
    embedding: number[];
}[]> {
    return await query(
        `SELECT image_id, embedding FROM image_embeddings`
    );
}
