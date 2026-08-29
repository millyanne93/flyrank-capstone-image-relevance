import { getProcessingStats } from '../src/repositories/images.repository';
import { getTotalCost } from '../src/services/cost.service';
import { closePool, pool } from '../src/db/client';

async function checkStats() {
    console.log('\n IMAGE PROCESSING STATS\n');
    console.log('═══════════════════════════════════════');

    // ✅ Direct database query
    try {
        const test = await pool.query('SELECT COUNT(*) FROM images');
        console.log(` Direct DB query: ${test.rows[0].count} images found`);

        // ✅ Also check processing status directly
        const statusTest = await pool.query('SELECT processing_status, COUNT(*) FROM images GROUP BY processing_status');
        console.log(' Status breakdown:', statusTest.rows);
    } catch (error) {
        console.error(' Database connection error:', error);
    }

    // ✅ Get stats from repository
    const stats = await getProcessingStats();
    const total = stats.pending + stats.processing + stats.tagged + stats.flagged + stats.failed;

    console.log(`\n Total Images: ${total}`);
    console.log(` Tagged: ${stats.tagged}`);
    console.log(` Pending: ${stats.pending}`);
    console.log(` Processing: ${stats.processing}`);
    console.log(` Flagged: ${stats.flagged}`);
    console.log(` Failed: ${stats.failed}`);

    const totalCost = await getTotalCost();
    console.log(` Total Cost: $${totalCost.toFixed(8)}`);

    console.log('═══════════════════════════════════════');

    await closePool();
}

checkStats().catch(console.error);
