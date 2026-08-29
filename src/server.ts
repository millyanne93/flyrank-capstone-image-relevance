import express from 'express';
import { config } from './config';
import imageRoutes from './routes/images.routes';
import postRoutes from './routes/posts.routes'; 
import suggestionRoutes from './routes/suggestions.routes'; 

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    phase: '2',
    timestamp: new Date().toISOString(),
  });
});

app.use('/', imageRoutes);
app.use('/', postRoutes);
app.use('/', suggestionRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(' Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(` Server running on http://localhost:${config.port}`);
  console.log(` Health: http://localhost:${config.port}/health`);
  console.log(` Phase 2 - Vision Pipeline Ready`);
  console.log(` POST /api/images/batch-process to start processing`);
  console.log(` POST /api/posts`);
  console.log(` GET /api/posts/:id/images`);
  console.log(` GET /api/suggestions`);
});
