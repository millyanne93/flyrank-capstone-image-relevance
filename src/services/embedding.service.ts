import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { estimateEmbeddingCost, logCost } from './cost.service';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({
            model: config.gemini.embeddingModel,
        });
        
        const result = await model.embedContent(text);
        const embedding = result.embedding.values;
        
        const cost = estimateEmbeddingCost(200);
        await logCost('embedding', text.substring(0, 50), cost);
        
        return embedding;
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error;
    }
}
