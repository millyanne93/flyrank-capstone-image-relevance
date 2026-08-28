import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: requireEnv('DATABASE_URL'),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    visionModel: process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  },
  
  thresholds: {
    similarity: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.65'),
    confidence: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.70'),
  },
  
  batch: {
    maxRetries: 3,
    retryDelayMs: 2000,
    batchSize: 10,
  },
  
  env: process.env.NODE_ENV || 'development',
};
