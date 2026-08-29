import { getAllImages } from '../src/repositories/images.repository';
import { generateEmbedding } from '../src/services/embedding.service';
import { saveImageEmbedding } from '../src/repositories/imageEmbedding.repository';
import { getAllPosts, savePostEmbedding } from '../src/repositories/posts.repository';
import { closePool } from '../src/db/client';
import { getProcessingStats } from '../src/repositories/images.repository';

async function runEmbeddingBatch() {
    console.log('\n Starting embedding batch job...\n');
    console.log('═══════════════════════════════════════');

    // Show current stats
    const stats = await getProcessingStats();
    console.log(' Current status:');
    console.log(`   Tagged: ${stats.tagged}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Flagged: ${stats.flagged}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log('');

    console.log('📸 Generating embeddings for tagged images...');
    const images = await getAllImages();
    let imageCount = 0;

    for (const image of images) {
        if (image.processing_status !== 'tagged') continue;
        if (!image.caption) {
            console.log(`   Skipping ${image.filename} - no caption`);
            continue;
        }

        try {
            console.log(`   Embedding: ${image.filename}...`);
            const embedding = await generateEmbedding(image.caption,image.id);
            await saveImageEmbedding(image.id, embedding);
            imageCount++;
            console.log(`   ${image.filename} embedded`);
        } catch (error) {
            console.error(`  Failed to embed ${image.filename}:`, error);
        }
    }

    console.log(`\n Image embeddings: ${imageCount} generated\n`);

    console.log('Generating embeddings for posts...');
    const posts = await getAllPosts();
    let postCount = 0;

    for (const post of posts) {
        try {
            const text = `${post.title}\n${post.body}`;
            console.log(`   Embedding: ${post.title}...`);
            const embedding = await generateEmbedding(text, post.id);
            await savePostEmbedding(post.id, embedding);
            postCount++;
            console.log(`   ${post.title} embedded`);
        } catch (error) {
            console.error(`   Failed to embed post ${post.title}:`, error);
        }
    }

    console.log(`\n Post embeddings: ${postCount} generated`);

    console.log('\n═══════════════════════════════════════');
    console.log(` Summary:`);
    console.log(`   Image embeddings: ${imageCount}`);
    console.log(`   Post embeddings: ${postCount}`);
    console.log('═══════════════════════════════════════\n');

    await closePool();
}

runEmbeddingBatch().catch(console.error);
