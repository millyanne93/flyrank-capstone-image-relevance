import fs from 'fs';
import { getPostById } from '../src/repositories/posts.repository';
import { findBestMatch } from '../src/services/matching.service';
import { closePool } from '../src/db/client';
import { getImageByFilename } from '../src/repositories/images.repository';

interface EvalItem {
    post_id: string;
    post_title: string;
    correct_image_filename: string;
}

async function computePrecision() {
    console.log(' Computing Top-1 Precision...\n');

    const evalData: { eval_set: EvalItem[] } = JSON.parse(
        fs.readFileSync('data/eval-set.json', 'utf8')
    );

    let correct = 0;
    let total = 0;
    const results: any[] = [];

    for (const item of evalData.eval_set) {
        total++;
        console.log(` Evaluating: ${item.post_title}`);

        const correctImage = await getImageByFilename(item.correct_image_filename);
        if (!correctImage) {
            console.log(`   Correct image not found: ${item.correct_image_filename}`);
            results.push({ ...item, success: false, reason: 'Image not found' });
            continue;
        }

        const post = await getPostById(item.post_id);
        if (!post) {
            console.log(`   Post not found: ${item.post_id}`);
            results.push({ ...item, success: false, reason: 'Post not found' });
            continue;
        }

        try {
            const match = await findBestMatch(
                post.id,
                post.title,
                post.category || 'animal'
            );

            const isCorrect = match.accepted && match.image_id === correctImage.id;
            if (isCorrect) correct++;

            console.log(`   ${isCorrect ? '✅' : '❌'} Match: ${match.accepted ? match.image_id : 'rejected'}`);
            console.log(`   Expected: ${item.correct_image_filename}`);
            console.log(`   Reason: ${match.reason || 'N/A'}`);

            results.push({
                ...item,
                suggested_image: match.image_id,
                accepted: match.accepted,
                is_correct: isCorrect,
                reason: match.reason,
            });

        } catch (error) {
            console.log(`   ❌ Error: ${(error as Error).message}`);
            results.push({ ...item, success: false, reason: (error as Error).message });
        }

        console.log('');
    }

    const precision = total > 0 ? (correct / total) * 100 : 0;

    console.log('  Precision Results:');
    console.log(`   Total eval items: ${total}`);
    console.log(`   Correct matches: ${correct}`);
    console.log(`   Top-1 Precision: ${precision.toFixed(1)}%`);
    console.log('');

    fs.writeFileSync('data/precision-results.json', JSON.stringify({ results, precision }, null, 2));
    console.log('Detailed results saved to data/precision-results.json');

    await closePool();
}

computePrecision().catch(console.error);
