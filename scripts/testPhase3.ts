import { createPost } from '../src/repositories/posts.repository';
import { findBestMatch } from '../src/services/matching.service';
import { closePool } from '../src/db/client';
import { config } from '../src/config';

async function testPhase3() {
    console.log('Testing Phase 3: Matching Engine\n');

    // 1. Create a test post
    console.log('Creating test post...');
    const post = await createPost(
        'The Behavior of Red Foxes',
        'Red foxes are highly adaptable mammals found across the Northern Hemisphere. They are known for their distinctive red-orange fur, bushy tail, and clever hunting strategies.',
        'animal'
    );
    console.log(`Created post: ${post.title} (${post.id})`);

    const result = await findBestMatch(
        post.id,
        post.title,
        post.category || 'animal'
    );

    console.log('\n Matching Result:');
    console.log(`   Post: ${post.title}`);
    console.log(`   Accepted: ${result.accepted}`);
    console.log(`   Reason: ${result.reason || 'N/A'}`);
    if (result.image_id) {
        console.log(`   Image ID: ${result.image_id}`);
        console.log(`   Similarity: ${result.similarity_score?.toFixed(3)}`);
    } 

    await closePool();
    console.log('\n Phase 3 test complete!');
}

testPhase3().catch(console.error);
