import { Router, Request, Response } from 'express';
import { runVisionBatch } from '../jobs/visionBatch.job';
import { getImageById, getProcessingStats } from '../repositories/images.repository';
import { getTotalCost } from '../services/cost.service';

const router = Router();

router.post('/api/images/batch-process', async (req: Request, res: Response) => {
    try {

        const result = await runVisionBatch();

        res.json({
            success: true,
            message: 'Batch processing complete',
            stats: result,
        });
    } catch (error) {
        console.error('Batch job failed:', error);
        res.status(500).json({
            error: 'Batch job failed',
            message: (error as Error).message,
        });
    }
});

router.get('/api/images/:id', async (req: Request, res: Response) => {
    try {
        const image = await getImageById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }
        res.json(image);
    } catch (error) {
        console.error('Failed to get image:', error);
        res.status(500).json({ error: 'Failed to get image' });
    }
});

router.get('/api/images/stats', async (req: Request, res: Response) => {
    try {
        const stats = await getProcessingStats();
        const totalCost = await getTotalCost();
        res.json({
            ...stats,
            total_cost: totalCost,
        });
    } catch (error) {
        console.error('Failed to get stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
