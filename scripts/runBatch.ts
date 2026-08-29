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

    console.log(`\n  Batch Result:`);
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Tagged: ${result.tagged}`);
    console.log(`   Flagged: ${result.flagged}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Quota Exhausted: ${result.quota_exhausted}`);

    console.log(`\n  Database Totals:`);
    console.log(`   Total Images: ${finalStats.pending + finalStats.processing + finalStats.tagged + finalStats.flagged + finalStats.failed}`);
    console.log(`   Tagged: ${finalStats.tagged}`);
    console.log(`   Pending: ${finalStats.pending}`);
    console.log(`   Flagged: ${finalStats.flagged}`);
    console.log(`   Failed: ${finalStats.failed}`);

    const totalCost = await getTotalCost();
    console.log(`Total cost: $${totalCost.toFixed(8)}`);

    await closePool();
}

runBatch().catch(console.error);
