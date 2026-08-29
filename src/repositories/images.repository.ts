import { query, queryOne } from '../db/client';

export interface Image {
    id: string;
    filename: string;
    filepath: string;
    subject?: string;
    category?: string;
    attributes?: string[];
    caption?: string;
    confidence?: number;
    processing_status: 'pending' | 'processing' | 'tagged' | 'flagged' | 'failed';
    created_at: Date;
    updated_at: Date;
}

export async function createImage(
    filename: string,
    filepath: string
): Promise<Image> {
    const rows = await query<Image>(
        `INSERT INTO images (filename, filepath, processing_status)
         VALUES ($1, $2, 'pending')
         RETURNING *`,
        [filename, filepath]
    );
    return rows[0];
}

export async function getPendingImages(limit: number = 10): Promise<Image[]> {
    return await query<Image>(
        `SELECT * FROM images
         WHERE processing_status = 'pending'
         ORDER BY created_at ASC
         LIMIT $1`,
        [limit]
    );
}

export async function getImageById(id: string): Promise<Image | null> {
    return await queryOne<Image>(
        'SELECT * FROM images WHERE id = $1',
        [id]
    );
}

export async function getImageByFilename(filename: string): Promise<Image | null> {
    return await queryOne<Image>(
        'SELECT * FROM images WHERE filename = $1',
        [filename]
    );
}

export async function claimImage(id: string): Promise<Image | null> {
    return await queryOne<Image>(
        `UPDATE images
         SET processing_status = 'processing', updated_at = NOW()
         WHERE id = $1 AND processing_status = 'pending'
         RETURNING *`,
        [id]
    );
}

export async function tagImage(
    id: string,
    subject: string,
    category: string,
    attributes: string[],
    caption: string,
    confidence: number
): Promise<Image | null> {
    return await queryOne<Image>(
        `UPDATE images
         SET subject = $2, category = $3, attributes = $4::jsonb,
             caption = $5, confidence = $6,
             processing_status = 'tagged', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, subject, category, JSON.stringify(attributes), caption, confidence]
    );
}

export async function flagImage(id: string, reason: string = 'Low confidence'): Promise<Image | null> {
    return await queryOne<Image>(
        `UPDATE images
         SET processing_status = 'flagged', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );
}

export async function failImage(id: string, reason: string = 'Processing failed'): Promise<Image | null> {
    return await queryOne<Image>(
        `UPDATE images
         SET processing_status = 'failed', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );
}

export async function getProcessingStats(): Promise<{
    pending: number;
    processing: number;
    tagged: number;
    flagged: number;
    failed: number;
}> {

    try {
        const rows = await query<{ processing_status: string; count: string }>(
            `SELECT processing_status, COUNT(*) as count
             FROM images
             GROUP BY processing_status`
        );

        const stats = { pending: 0, processing: 0, tagged: 0, flagged: 0, failed: 0 };

        for (const row of rows) {
            if (row.processing_status === 'pending') stats.pending = parseInt(row.count);
            else if (row.processing_status === 'processing') stats.processing = parseInt(row.count);
            else if (row.processing_status === 'tagged') stats.tagged = parseInt(row.count);
            else if (row.processing_status === 'flagged') stats.flagged = parseInt(row.count);
            else if (row.processing_status === 'failed') stats.failed = parseInt(row.count);
        }
        return stats;
    } catch (error) {
        return { pending: 0, processing: 0, tagged: 0, flagged: 0, failed: 0 };
    }
}
export async function countImages(): Promise<number> {
    const rows = await query<{ count: string }>('SELECT COUNT(*) as count FROM images');
    return parseInt(rows[0]?.count || '0');
}

export async function recoverStaleProcessingJobs(): Promise<number> {
    const result = await query(
        `UPDATE images
         SET processing_status = 'pending', updated_at = NOW()
         WHERE processing_status = 'processing'
         AND updated_at < NOW() - INTERVAL '10 minutes'
         RETURNING id`
    );
    return result.length;
}
export async function getAllImages(status?: string): Promise<Image[]> {
    let queryText = 'SELECT * FROM images';
    const params: any[] = [];
    
    if (status) {
        queryText += ' WHERE processing_status = $1';
        params.push(status);
    }
    
    queryText += ' ORDER BY created_at ASC';
    
    return await query<Image>(queryText, params);
}
