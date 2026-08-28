import { query, queryOne } from '../db/client';

export interface Post {
    id: string;
    title: string;
    body: string;
    category?: string;
    created_at: Date;
}

export async function createPost(
    title: string,
    body: string,
    category?: string
): Promise<Post> {
    const rows = await query<Post>(
        `INSERT INTO posts (title, body, category)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, body, category || null]
    );
    return rows[0];
}

export async function getPostById(id: string): Promise<Post | null> {
    return await queryOne<Post>(
        'SELECT * FROM posts WHERE id = $1',
        [id]
    );
}

export async function getAllPosts(): Promise<Post[]> {
    return await query<Post>(
        'SELECT * FROM posts ORDER BY created_at DESC'
    );
}

export async function savePostEmbedding(
    postId: string,
    embedding: number[]
): Promise<void> {
    await query(
        `INSERT INTO post_embeddings (post_id, embedding)
         VALUES ($1, $2)
         ON CONFLICT (post_id) DO UPDATE SET embedding = $2, created_at = NOW()`,
        [postId, embedding]
    );
}

export async function getPostEmbedding(postId: string): Promise<number[] | null> {
    const rows = await query<{ embedding: number[] }>(
        'SELECT embedding FROM post_embeddings WHERE post_id = $1',
        [postId]
    );
    return rows[0]?.embedding || null;
}
