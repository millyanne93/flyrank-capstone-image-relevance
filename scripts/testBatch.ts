import { runVisionBatch } from '../src/jobs/visionBatch.job';
import { closePool } from '../src/db/client';
import { getProcessingStats } from '../src/repositories/images.repository';
import { getTotalCost } from '../src/services/cost.service';
import { config } from '../src/config';

config.batch.batchSize = 3;

async function testBatch() {
    console.log('Running TEST batch (3 images only)...\n');

    const initialStats = await getProcessingStats();
    console.log('Initial stats:', initialStats);

    const result = await runVisionBatch();

    const finalStats = await getProcessingStats();
    console.log('\n Final stats:', finalStats);

    const totalCost = await getTotalCost();
    console.log(`Total cost: $${totalCost.toFixed(8)}`);

    console.log('\n Test complete! Check if images were tagged.');
    console.log(`   Tagged: ${result.tagged}`);
    console.log(`   Flagged: ${result.flagged}`);
    console.log(`   Failed: ${result.failed}`);

    await closePool();
}

testBatch().catch(console.error);
