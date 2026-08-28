import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { imageTagsSchema, VISION_PROMPT } from '../validation/imageTags.schema';
import { estimateVisionCost, logCost } from './cost.service';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export interface VisionResult {
    subject: string;
    category: string;
    attributes: string[];
    caption: string;
    confidence: number;
    processing_status: 'tagged' | 'flagged';
}

export async function analyzeImage(imagePath: string, imageId: string): Promise<VisionResult> {
    console.log(` Analyzing image: ${imagePath}`);

    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');

        const model = genAI.getGenerativeModel({
            model: config.gemini.visionModel,
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: VISION_PROMPT },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                    ],
                },
            ],
        });

        const responseText = result.response.text();
        console.log(` Raw response from Gemini: ${responseText.substring(0, 200)}...`);

        let parsed;
        try {
            let cleanResponse = responseText;
    
           cleanResponse = cleanResponse.replace(/```json\s*/gi, '');
           cleanResponse = cleanResponse.replace(/```\s*/g, '');
           cleanResponse = cleanResponse.trim();
    
           const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
           if (jsonMatch) {
               cleanResponse = jsonMatch[0];
           }

           parsed = JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Cleaned response:', cleanResponse);
            console.error('Original response:', responseText);
            throw new Error(`Failed to parse JSON response: ${responseText.substring(0, 100)}...`);
        }

        const validated = imageTagsSchema.parse(parsed);

        const cost = estimateVisionCost(300, 150);
        await logCost('vision', imageId, cost);

        const isTagged = validated.confidence >= config.thresholds.confidence;

        console.log(`Image analyzed: ${validated.subject} (conf: ${validated.confidence})`);

        return {
            subject: validated.subject,
            category: validated.category,
            attributes: validated.attributes,
            caption: validated.caption,
            confidence: validated.confidence,
            processing_status: isTagged ? 'tagged' : 'flagged',
        };

    } catch (error) {
        console.error(`Failed to analyze image ${imagePath}:`, error);
        throw error;
    }
}
