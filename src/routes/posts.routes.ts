import { Router, Request, Response } from 'express';
import { createPost, getPostById, getAllPosts } from '../repositories/posts.repository';
import { generateEmbedding } from '../services/embedding.service';
import { savePostEmbedding } from '../repositories/posts.repository';
import { findBestMatch } from '../services/matching.service';

const router = Router();

router.post('/api/posts', async (req: Request, res: Response) => {
    try {
        const { title, body, category } = req.body;
        
        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const post = await createPost(title, body, category || 'animal');
        console.log(`Created post: ${post.title}`);

        try {
            const text = `${post.title}\n${post.body}`;
            const embedding = await generateEmbedding(text);
            await savePostEmbedding(post.id, embedding);
            console.log(`Embedding generated for post: ${post.title}`);
        } catch (error) {
            console.log(`Embedding generation failed for post: ${post.title}`, error);
        }

        res.status(201).json(post);
    } catch (error) {
        console.error('Failed to create post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

router.get('/api/posts', async (req: Request, res: Response) => {
    try {
        const { getAllPosts } = await import('../repositories/posts.repository');
        const posts = await getAllPosts();
        res.json(posts);
    } catch (error) {
        console.error('Failed to get posts:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

router.get('/api/posts/:id/images', async (req: Request, res: Response) => {
    try {
        const post = await getPostById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const result = await findBestMatch(
            post.id,
            post.title,
            post.category || 'animal'
        );

        res.json({
            post_id: post.id,
            post_title: post.title,
            ...result,
        });
    } catch (error) {
        console.error('Matching failed:', error);
        res.status(500).json({ error: 'Failed to find match' });
    }
});

export default router;
