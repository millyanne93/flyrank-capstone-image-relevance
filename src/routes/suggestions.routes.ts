import { Router, Request, Response } from 'express';
import {
    getPendingSuggestions,
    approveSuggestion,
    rejectSuggestion,
    getSuggestionById,
} from '../repositories/suggestions.repository';

const router = Router();


router.get('/api/suggestions', async (req: Request, res: Response) => {
    try {
        const status = req.query.status as string || 'pending';
        const suggestions = await getPendingSuggestions();
        res.json(suggestions);
    } catch (error) {
        console.error('Failed to get suggestions:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

router.post('/api/suggestions/:id/approve', async (req: Request, res: Response) => {
    try {
        const suggestion = await approveSuggestion(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('Failed to approve suggestion:', error);
        res.status(500).json({ error: 'Failed to approve suggestion' });
    }
});

router.post('/api/suggestions/:id/reject', async (req: Request, res: Response) => {
    try {
        const suggestion = await rejectSuggestion(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('Failed to reject suggestion:', error);
        res.status(500).json({ error: 'Failed to reject suggestion' });
    }
});

router.get('/api/suggestions/:id', async (req: Request, res: Response) => {
    try {
        const suggestion = await getSuggestionById(req.params.id);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json(suggestion);
    } catch (error) {
        console.error('Failed to get suggestion:', error);
        res.status(500).json({ error: 'Failed to get suggestion' });
    }
});

export default router;
