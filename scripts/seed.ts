import { createImage, countImages, getImageByFilename } from '../src/repositories/images.repository';
import { closePool } from '../src/db/client';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = 'data/images';

async function seedImages() {
    console.log('Seeding images into database...');

    const existingCount = await countImages();
    if (existingCount > 0) {
        console.log(`${existingCount} images already exist in database. Skipping seed.`);
        await closePool();
        return;
    }

    const files = fs.readdirSync(IMAGE_DIR);
    const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));

    console.log(`Found ${imageFiles.length} images to seed`);

    let seeded = 0;
    for (const filename of imageFiles) {
        const filepath = path.join(IMAGE_DIR, filename);

        const existing = await getImageByFilename(filename);
        if (existing) {
            console.log(`${filename} already exists, skipping`);
            continue;
        }

        await createImage(filename, filepath);
        seeded++;
        console.log(`Seeded: ${filename}`);
    }

    console.log(`Seeded ${seeded} images (${imageFiles.length - seeded} already existed)`);

    await closePool();
}

seedImages().catch(console.error);
