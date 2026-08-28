import { z } from 'zod';

export const imageTagsSchema = z.object({
  subject: z.string().min(1, { message: 'Subject is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  attributes: z.array(z.string()).default([]),
  caption: z.string().min(1, { message: 'Caption is required' }),
  confidence: z.number().min(0).max(1, { message: 'Confidence must be between 0 and 1' }),
});

export type ImageTags = z.infer<typeof imageTagsSchema>;

export const VISION_PROMPT = `Analyze this image and provide structured information in valid JSON format.
The response MUST be valid JSON with exactly these fields:
- subject: (string) the specific subject of the image (e.g., "red fox", "gray wolf", "golden retriever")
- category: (string) the broad category (e.g., "animal", "plant", "landscape")
- attributes: (array of strings) descriptive attributes (e.g., ["orange fur", "wild", "forest"])
- caption: (string) a natural language description of the image
- confidence: (number between 0 and 1) your confidence in this analysis

Example response:
{
  "subject": "red fox",
  "category": "animal",
  "attributes": ["orange fur", "wild", "forest"],
  "caption": "A red fox standing in a forest",
  "confidence": 0.94
}

Return ONLY the JSON, no other text.`;
