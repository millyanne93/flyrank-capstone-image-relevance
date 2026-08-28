import { getAllImages } from '../repositories/images.repository';
import { generateEmbedding } from '../services/embedding.service';
import { saveImageEmbedding } from '../repositories/imageEmbedding.repository';
import { getAllPosts, savePostEmbedding } from '../repositories/posts.repository';

export async function runEmbeddingBatch() {
    console.log('Starting embedding batch job...');

    const images = await getAllImages();
    let imageCount = 0;
    for (const image of images) {
        if (image.caption) {
            try {
                const embedding = await generateEmbedding(image.caption);
                await saveImageEmbedding(image.id, embedding);
                imageCount++;
                console.log(`Image embedding: ${image.filename}`);
            } catch (error) {
                console.error(`Failed to embed image ${image.filename}:`, error);
            }
        }
    }

    const posts = await getAllPosts();
    let postCount = 0;
    for (const post of posts) {
        try {
            const text = `${post.title}\n${post.body}`;
            const embedding = await generateEmbedding(text);
            await savePostEmbedding(post.id, embedding);
            postCount++;
            console.log(`Post embedding: ${post.title}`);
        } catch (error) {
            console.error(`Failed to embed post ${post.title}:`, error);
        }
    }

    console.log(` Embedding Batch Complete:
   Images: ${imageCount}
   Posts: ${postCount}
    `);
}
