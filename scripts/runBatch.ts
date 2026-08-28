import { runVisionBatch } from '../src/jobs/visionBatch.job';
import { closePool } from '../src/db/client';
import { getProcessingStats } from '../src/repositories/images.repository';
import { getTotalCost } from '../src/services/cost.service';

async function runBatch() {
    console.log('Running vision batch job...\n');

    const initialStats = await getProcessingStats();
    console.log('Initial stats:', initialStats);

    const result = await runVisionBatch();

    const finalStats = await getProcessingStats();
    console.log('\n Final stats:', finalStats);

    const totalCost = await getTotalCost();
    console.log(`Total cost: $${totalCost.toFixed(8)}`);

    await closePool();
}

runBatch().catch(console.error);
