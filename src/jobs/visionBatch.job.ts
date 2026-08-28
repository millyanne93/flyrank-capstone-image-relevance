import { analyzeImage } from '../services/vision.service';
import { claimImage, getPendingImages, tagImage, flagImage, failImage, recoverStaleProcessingJobs } from '../repositories/images.repository';
import { config } from '../config';

const MAX_RETRIES = 3;
const BATCH_SIZE = config.batch.batchSize || 10;

let quotaExhausted = false;

export async function runVisionBatch(): Promise<{
    processed: number;
    tagged: number;
    flagged: number;
    failed: number;
    quota_exhausted: boolean;
}> {
    console.log('🚀 Starting vision batch job...');

    const recovered = await recoverStaleProcessingJobs();
    if (recovered > 0) {
        console.log(`Recovered ${recovered} stale processing jobs`);
    }

    let processed = 0;
    let tagged = 0;
    let flagged = 0;
    let failed = 0;

    if (quotaExhausted) {
        console.log('Daily quota already exhausted. Please try again tomorrow.');
        return { processed, tagged, flagged, failed, quota_exhausted: true };
    }

    const pendingImages = await getPendingImages(BATCH_SIZE);
    console.log(`Found ${pendingImages.length} pending images`);

    for (const image of pendingImages) {
        // Stop if quota exhausted
        if (quotaExhausted) {
            console.log('Quota exhausted. Stopping batch. Remaining images left as pending.');
            break;
        }

        processed++;

        const claimed = await claimImage(image.id);
        if (!claimed) {
            console.log(`Image ${image.filename} already claimed, skipping`);
            continue;
        }

        console.log(`Processing: ${image.filename}`);

        let success = false;
        let lastError: Error | null = null;
        let isQuotaError = false;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await analyzeImage(image.filepath, image.id);

                if (result.processing_status === 'tagged') {
                    await tagImage(
                        image.id,
                        result.subject,
                        result.category,
                        result.attributes,
                        result.caption,
                        result.confidence
                    );
                    tagged++;
                    success = true;
                    console.log(`Tagged: ${image.filename} → ${result.subject}`);
                    break;

                } else if (result.processing_status === 'flagged') {
                    await flagImage(image.id, `Low confidence: ${result.confidence}`);
                    flagged++;
                    success = true;
                    console.log(`Flagged: ${image.filename} (conf: ${result.confidence})`);
                    break;
                }

            } catch (error) {
                lastError = error as Error;
                const message = lastError.message;

                if (message.includes('429') || message.includes('quota')) {
                    console.log(`Daily quota exceeded for ${image.filename}`);
                    isQuotaError = true;
                    quotaExhausted = true;
                    
                    await query(
                        'UPDATE images SET processing_status = $1 WHERE id = $2',
                        ['pending', image.id]
                    );
                    break;
                }

                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt}/${MAX_RETRIES})`);
                    await sleep(delay);
                }
            }
        }

        if (!success && !isQuotaError) {
            await failImage(image.id, lastError?.message || 'Max retries exceeded');
            failed++;
            console.log(`❌ Failed: ${image.filename} after ${MAX_RETRIES} attempts`);
        }

        if (!quotaExhausted) {
            await sleep(12000);
        }
    }

    console.log(`Batch Job Complete:
   Processed: ${processed}
   Tagged: ${tagged}
   Flagged: ${flagged}
   Failed: ${failed}
   Quota Exhausted: ${quotaExhausted}
    `);

    return { processed, tagged, flagged, failed, quotaExhausted };
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

import { query } from '../db/client';
